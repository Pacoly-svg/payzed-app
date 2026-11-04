// Moteur SIM (v1.8) : programmées invisibles jusqu'à l'arrivée, persistance, types, frais, purge,
// + historique (œil global, masquage manuel).
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
  const findTx = async (pred) => (await txs()).find(pred);
  const historyHas = (text) => p.locator('.app-scroll section').last().getByText(text, { exact: true }).count();
  const unlock = async () => { for (const d of ['1', '2', '3', '4']) await p.getByRole('button', { name: d, exact: true }).tap(); await p.waitForTimeout(300); };
  const closeSheets = async () => {
    for (let i = 0; i < 4 && (await p.locator('[role=dialog]').count()); i++) {
      await p.keyboard.press('Escape');
      await p.waitForTimeout(150);
      if (await p.getByText("Abandonner l'opération ?").isVisible()) await p.getByRole('button', { name: 'Abandonner' }).tap();
    }
  };
  const openSim = async () => {
    await closeSheets();
    await p.getByRole('button', { name: 'Profil', exact: true }).tap();
    await p.waitForTimeout(300);
    await p.getByRole('button', { name: /^Simulations/ }).tap();
    await p.waitForTimeout(400);
  };
  const sim = async ({ kind, name, merchant, amount, delay = 0, unit = 's', outcome = 'Réussie' }) => {
    const d = p.locator('[role=dialog]').last();
    await d.getByRole('button', { name: kind, exact: true }).tap();
    if (merchant) await d.getByRole('button', { name: merchant }).first().tap();
    if (name) await d.locator('input[placeholder="Nom et prénom"]').fill(name);
    await d.locator('input[inputmode=numeric]').first().fill(String(amount));
    await d.locator('input[aria-label="Durée de traitement"]').fill(String(delay));
    await d.getByRole('button', { name: unit, exact: true }).tap();
    await d.getByRole('button', { name: outcome, exact: true }).tap();
    await d.getByRole('button', { name: 'Lancer la simulation' }).tap();
    await p.waitForTimeout(300);
  };
  const toHome = async () => { await closeSheets(); await p.getByRole('button', { name: 'Accueil', exact: true }).tap(); await p.waitForTimeout(300); };

  await p.goto(URL);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  await unlock();
  const start = await bal();

  // SIM protégé par le PIN
  await p.getByRole('button', { name: 'Profil', exact: true }).tap();
  await p.waitForTimeout(300);
  check('Simulations masquées tant que SIM est inactif', (await p.getByRole('button', { name: /^Simulations/ }).count()) === 0);
  await p.getByRole('switch', { name: 'SIM' }).tap();
  await p.locator('[role=dialog] input[type=password]').fill('0000');
  await p.getByRole('button', { name: 'Activer' }).tap();
  check('Mauvais code refusé', await p.getByText('Code incorrect').isVisible());
  await p.locator('[role=dialog] input[type=password]').fill('1234');
  await p.getByRole('button', { name: 'Activer' }).tap();
  await p.waitForTimeout(300);
  check('Simulations visibles après activation de SIM', (await p.getByRole('button', { name: /^Simulations/ }).count()) === 1);

  // 1) Entrée programmée dans 10 s : invisible et sans effet jusqu'à l'arrivée
  await openSim();
  await sim({ kind: 'Entrée', name: 'Moussa Test Diop', amount: 100000, delay: 10, unit: 's' });
  let t = await findTx((x) => x.title === 'Moussa Test Diop' && x.isSimulated);
  check('Programmée : enregistrée « En attente »', t && t.status === 'pending', t && t.status);
  check('Programmée : solde inchangé', (await bal()) === start);
  check('Programmée : listée dans « Programmées »', await p.locator('[role=dialog]').getByText('arrive dans').first().isVisible());
  await toHome();
  check('Programmée : absente de l’historique', (await historyHas('Moussa Test Diop')) === 0);
  await p.waitForTimeout(3000);
  t = await findTx((x) => x.id === t.id);
  check('Passe « En cours de traitement » (toujours invisible)', t.status === 'processing' && (await historyHas('Moussa Test Diop')) === 0, t.status);
  await p.waitForTimeout(8000);
  t = await findTx((x) => x.id === t.id);
  check('Arrivée après 10 s : « Réussie »', t.status === 'completed' && t.sim.settled, t.status);
  check('Arrivée : apparaît dans l’historique', (await historyHas('Moussa Test Diop')) === 1);
  check('Arrivée : solde crédité une fois (+100 000)', (await bal()) === start + 100000, String((await bal()) - start));
  check('Arrivée : notification « Argent reçu »', await p.locator('[role=alert]').getByText('Argent reçu').isVisible());
  const amountColor = await p.locator('.app-scroll section').last().locator('button:has-text("Moussa Test Diop") span.tabular-nums').first().evaluate((e) => getComputedStyle(e).color);
  check('Montant reçu en noir (identité noir & blanc)', amountColor === 'rgb(0, 0, 0)', amountColor);

  // 2) Envoi programmé à échouer dans 2 min, avec redémarrage
  const b2 = await bal();
  await openSim();
  await sim({ kind: 'Envoi', name: 'Fatou Sow', amount: 50000, delay: 2, unit: 'min', outcome: 'Échouée' });
  t = await findTx((x) => x.title === 'Fatou Sow' && x.isSimulated);
  check('Envoi programmé : aucun débit avant l’arrivée', (await bal()) === b2);
  await closeSheets();
  await p.reload();
  await p.waitForTimeout(500);
  check('Après redémarrage : toujours programmé', (await findTx((x) => x.id === t.id)).status === 'pending');
  await p.evaluate((id) => {
    const list = JSON.parse(localStorage.getItem('payzed_transactions'));
    const x = list.find((i) => i.id === id);
    x.sim.processingAt = Date.now() - 90_000;
    x.sim.resolveAt = Date.now() - 1000;
    localStorage.setItem('payzed_transactions', JSON.stringify(list));
  }, t.id);
  await p.reload();
  await p.waitForTimeout(1500);
  t = await findTx((x) => x.id === t.id);
  check('Rattrapage au redémarrage : « Échouée »', t.status === 'failed', t.status);
  check('Échec : aucun débit', (await bal()) === b2);
  await unlock();
  check('Échec visible dans l’historique (rouge)', (await p.locator('.app-scroll').getByText('Échoué', { exact: true }).count()) >= 1);

  // 3) Envoi programmé dans 1 jour, annulé → disparaît
  await openSim();
  await sim({ kind: 'Envoi', name: 'Awa Test Ndiaye', amount: 30000, delay: 1, unit: 'j' });
  check('Listé « arrive dans 1 j »', await p.locator('[role=dialog]').getByText('arrive dans 1 j').isVisible());
  await p.locator('[role=dialog]').getByRole('button', { name: 'Annuler', exact: true }).first().tap();
  await p.waitForTimeout(300);
  check('Annulée : supprimée sans trace', !(await findTx((x) => x.title === 'Awa Test Ndiaye')));

  // 4) Achat, dépôt, retrait immédiats + frais
  let before = await bal();
  await sim({ kind: 'Achat', merchant: 'Auchan', amount: 12500 });
  check('Achat Auchan : 12 500 + 125 de frais', before - (await bal()) === 12625, String(before - (await bal())));
  before = await bal();
  await sim({ kind: 'Dépôt', amount: 50000 });
  check('Dépôt : +50 000 sans frais', (await bal()) - before === 50000);
  before = await bal();
  await sim({ kind: 'Retrait', amount: 20000 });
  check('Retrait : 20 000 + 200 de frais', before - (await bal()) === 20200);
  await sim({ kind: 'Achat', merchant: 'Café de Rome', amount: 8000 });
  await toHome();
  check('Historique : « Auchan · Paiement par carte »', (await p.locator('.app-scroll').getByText(/Paiement par carte/).count()) >= 1);

  // 5) Historique : masquage manuel puis œil global
  await p.getByRole('button', { name: 'Choisir', exact: true }).tap();
  await p.locator('.app-scroll section').last().locator('button:has-text("Auchan")').first().tap();
  await p.getByRole('button', { name: /Masquer \(1\)/ }).tap();
  await p.waitForTimeout(300);
  check('Masquage manuel : Auchan retiré de « Tout »', (await historyHas('Auchan')) === 0);
  check('Filtre « Masqués (1) » proposé', (await p.getByRole('button', { name: 'Masqués (1)' }).count()) === 1);
  await p.getByRole('button', { name: "Masquer l'historique" }).tap();
  check('Œil : historique entièrement masqué', await p.getByText('Historique masqué').isVisible());
  await p.getByRole('button', { name: "Afficher l'historique" }).tap();
  check('Œil : historique réaffiché', !(await p.getByText('Historique masqué').isVisible()));

  // 6) Purge
  await openSim();
  await p.locator('[role=dialog]').getByRole('button', { name: 'Effacer toutes les opérations SIM' }).tap();
  await p.getByRole('button', { name: 'Tout effacer' }).tap();
  await p.waitForTimeout(300);
  check('Purge : plus aucune opération simulée', (await txs()).every((i) => !i.isSimulated));
  check('Purge : solde identique au départ', (await bal()) === start, String((await bal()) - start));

  check('Aucune erreur JavaScript', errs.length === 0, errs.join(' | '));
  console.log(`${pass} OK / ${fail} échec(s)`);
  await b.close();
})();
