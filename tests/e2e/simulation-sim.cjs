// Moteur SIM : statuts, délais, persistance après redémarrage, annulation, purge.
const { chromium, devices } = require('playwright');
const S = process.argv[2] || require('os').tmpdir(); // dossier des captures
const URL = process.env.PAYZED_URL || 'http://localhost:4173/';
let pass = 0, fail = 0;
const check = (label, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'OK ' : 'ÉCHEC'} ${label} ${extra}`); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Galaxy S9+'], viewport: { width: 384, height: 832 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const bal = () => p.evaluate(() => JSON.parse(localStorage.getItem('payzed_balance')));
  const txs = () => p.evaluate(() => JSON.parse(localStorage.getItem('payzed_transactions')));
  const unlock = async () => { for (const d of ['1', '2', '3', '4']) await p.getByRole('button', { name: d, exact: true }).tap(); await p.waitForTimeout(300); };
  const openSim = async () => {
    await p.getByRole('button', { name: 'Profil', exact: true }).tap();
    await p.waitForTimeout(300);
    await p.getByRole('button', { name: /^SIM/ }).tap();
    await p.waitForTimeout(400);
  };
  const fillSim = async ({ kind, name, amount, delay, unit, outcome }) => {
    const d = p.locator('[role=dialog]').last();
    await d.getByRole('button', { name: kind, exact: true }).tap();
    await d.locator('input[placeholder="Nom et prénom"]').fill(name);
    await d.locator('input[inputmode=numeric]').first().fill(String(amount));
    await d.locator('input[aria-label="Durée de traitement"]').fill(String(delay));
    await d.getByRole('button', { name: unit, exact: true }).tap();
    await d.getByRole('button', { name: outcome, exact: true }).tap();
    await d.getByRole('button', { name: 'Lancer la simulation' }).tap();
    await p.waitForTimeout(300);
  };
  const closeSheets = async () => { while (await p.locator('[role=dialog]').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); if (await p.getByText("Abandonner l'opération ?").isVisible()) await p.getByRole('button', { name: 'Abandonner' }).tap(); } };

  await p.goto(URL);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  await unlock();
  const start = await bal();

  // Mode test protégé par le PIN
  await p.getByRole('button', { name: 'Profil', exact: true }).tap();
  await p.waitForTimeout(300);
  check('SIM masqué tant que le mode test est inactif', (await p.getByRole('button', { name: /^SIM/ }).count()) === 0);
  await p.getByRole('switch', { name: 'Mode test' }).tap();
  await p.locator('[role=dialog] input[type=password]').fill('0000');
  await p.getByRole('button', { name: 'Activer' }).tap();
  check('Mauvais code refusé', await p.getByText('Code incorrect').isVisible());
  await p.locator('[role=dialog] input[type=password]').fill('1234');
  await p.getByRole('button', { name: 'Activer' }).tap();
  await p.waitForTimeout(300);
  check('SIM visible après activation par PIN', (await p.getByRole('button', { name: /^SIM/ }).count()) === 1);

  // 1) Entrée réussie après 10 s : en attente → en cours → réussie
  await openSim();
  await fillSim({ kind: 'Entrée', name: 'Babacar Sy', amount: 100000, delay: 10, unit: 's', outcome: 'Réussie' });
  let t = (await txs())[0];
  check('Entrée créée « En attente »', t.status === 'pending' && t.isSimulated === true, t.status);
  check('Solde inchangé tant que l’entrée n’a pas réussi', (await bal()) === start);
  await p.waitForTimeout(3000);
  t = (await txs())[0];
  check('Passage « En cours de traitement »', t.status === 'processing', t.status);
  await p.waitForTimeout(8500);
  t = (await txs())[0];
  check('Entrée « Réussie » après 10 s', t.status === 'completed' && t.sim.settled, t.status);
  check('Solde crédité une seule fois (+100 000)', (await bal()) === start + 100000, String((await bal()) - start));
  check('Notification affichée', await p.locator('[role=alert]').isVisible());

  // 2) Envoi échoué dans 2 min : débit immédiat, puis redémarrage, puis échéance
  const before2 = await bal();
  await fillSim({ kind: 'Envoi', name: 'Fatou Sow', amount: 50000, delay: 2, unit: 'min', outcome: 'Échouée' });
  t = (await txs())[0];
  check('Envoi en attente : montant + frais débités', (await bal()) === before2 - 50500, String(before2 - (await bal())));
  await closeSheets();
  await p.reload(); // redémarrage de l'app
  await p.waitForTimeout(600);
  check('Après redémarrage : toujours en attente', (await txs())[0].status === 'pending' && (await bal()) === before2 - 50500);
  // L'échéance passe pendant que l'app est fermée
  await p.evaluate((id) => {
    const list = JSON.parse(localStorage.getItem('payzed_transactions'));
    const x = list.find((i) => i.id === id);
    x.sim.processingAt = Date.now() - 90_000;
    x.sim.resolveAt = Date.now() - 1000;
    localStorage.setItem('payzed_transactions', JSON.stringify(list));
  }, t.id);
  await p.reload();
  await p.waitForTimeout(1500);
  const t2 = (await txs()).find((i) => i.id === t.id);
  check('Rattrapage au redémarrage : statut « Échouée »', t2.status === 'failed' && t2.sim.settled, t2.status);
  check('Échec : montant + frais recrédités', (await bal()) === before2, String((await bal()) - before2));
  await p.reload();
  await p.waitForTimeout(1200);
  check('Pas de double remboursement après un nouveau redémarrage', (await bal()) === before2);

  // 3) Envoi dans 1 jour, annulé
  await unlock();
  await openSim();
  const before3 = await bal();
  await fillSim({ kind: 'Envoi', name: 'Cheikh Ndiaye', amount: 30000, delay: 1, unit: 'j', outcome: 'Réussie' });
  check('Opération listée « En cours » dans SIM', await p.locator('[role=dialog]').getByText('résultat dans 1 j').isVisible());
  await p.locator('[role=dialog]').getByRole('button', { name: 'Annuler', exact: true }).first().tap();
  await p.waitForTimeout(300);
  t = (await txs())[0];
  check('Annulation : statut « Annulée »', t.status === 'cancelled', t.status);
  check('Annulation : montant recrédité', (await bal()) === before3);

  // 4) Purge : tout revient comme avant les simulations
  await p.locator('[role=dialog]').getByRole('button', { name: 'Effacer toutes les opérations SIM' }).tap();
  await p.getByRole('button', { name: 'Tout effacer' }).tap();
  await p.waitForTimeout(300);
  check('Purge : plus aucune opération simulée', (await txs()).every((i) => !i.isSimulated));
  check('Purge : solde identique au départ', (await bal()) === start, String((await bal()) - start));

  check('Aucune erreur JavaScript', errs.length === 0, errs.join(' | '));
  console.log(`${pass} OK / ${fail} échec(s)`);
  await b.close();
})();
