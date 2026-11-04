// Réglages (v1.9) : engrenage, comptes multiples, plan Pro, parrainage, appareils, service client, déconnexion.
const { chromium, devices } = require('playwright');
const S = process.argv[2] || require('os').tmpdir();
const URL = process.env.PAYZED_URL || 'http://localhost:4173/';
let pass = 0, fail = 0;
const check = (label, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'OK ' : 'ÉCHEC'} ${label} ${extra}`); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Galaxy S9+'], viewport: { width: 384, height: 832 }, deviceScaleFactor: 2 });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const get = (k) => p.evaluate((key) => JSON.parse(localStorage.getItem('payzed_' + key)), k);
  const dlg = () => p.locator('[role=dialog]').last();
  const title = () => dlg().getAttribute('aria-label');
  const unlock = async () => { for (const d of ['1', '2', '3', '4']) await p.getByRole('button', { name: d, exact: true }).tap(); await p.waitForTimeout(300); };
  const openSettings = async () => { await p.getByRole('button', { name: 'Réglages', exact: true }).tap(); await p.waitForTimeout(350); };
  const tapRow = async (text) => { await dlg().getByRole('button', { name: new RegExp(text) }).first().tap(); await p.waitForTimeout(250); };

  await p.goto(URL);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  await unlock();
  const start = await get('balance');

  // En-tête : engrenage à gauche, scanner à droite
  const gear = await p.getByRole('button', { name: 'Réglages', exact: true }).boundingBox();
  const scan = await p.getByRole('button', { name: /Scanner/ }).boundingBox();
  check('Engrenage en haut à gauche', gear && gear.x < 40 && gear.y < 80, JSON.stringify(gear));
  check('Scanner en haut à droite', scan && scan.x > 300);

  await openSettings();
  check('Fenêtre « Réglages » ouverte', (await title()) === 'Réglages');
  for (const t of ['COLY SENE', 'Ajouter un autre compte', 'Inviter un ami', 'Parrainer un ami', 'Vos appareils', 'Plan', 'Service client', 'Se déconnecter']) {
    check(`Réglages : « ${t} »`, (await dlg().getByText(t, { exact: true }).count()) >= 1);
  }
  check('Badge GRATUIT', await dlg().getByText('GRATUIT', { exact: true }).isVisible());
  await p.screenshot({ path: `${S}/reglages-racine.png` });

  // Vos appareils
  await tapRow('Vos appareils');
  check('Appareils : modèle détecté (Samsung SM-G965…)', (await dlg().getByText(/Samsung SM-G965/).count()) >= 1);
  check('Appareils : « Cet appareil »', (await dlg().getByText('Cet appareil', { exact: true }).count()) >= 1);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(250);
  check('Retour : revient à la racine des Réglages (sans fermer)', (await title()) === 'Réglages');

  // Parrainage
  await tapRow('Parrainer un ami');
  check('Parrainage : code COLY3514', await dlg().getByText('COLY3514', { exact: true }).isVisible());
  await dlg().getByText('COLY3514', { exact: true }).tap();
  await p.waitForTimeout(200);
  check('Parrainage : code copié', (await p.evaluate(() => navigator.clipboard.readText())) === 'COLY3514');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(250);

  // Plan Pro
  await tapRow('^Plan');
  await dlg().getByRole('button', { name: /Passer à Pro/ }).tap();
  await p.waitForTimeout(250);
  await dlg().getByRole('button', { name: 'Payer et activer Pro' }).tap();
  await p.waitForTimeout(1200);
  check('Pro : « Pro activé »', await dlg().getByText('Pro activé').isVisible());
  check('Pro : 2 500 FCFA prélevés, sans frais', start - (await get('balance')) === 2500, String(start - (await get('balance'))));
  check('Pro : plan enregistré', (await get('user')).plan === 'pro');
  check('Pro : opération « Payzed Pro » dans l’historique', (await get('transactions')).some((t) => t.title === 'Payzed Pro' && t.amount === -2500));
  await dlg().getByRole('button', { name: 'Terminé' }).tap();
  await p.waitForTimeout(250);
  check('Pro : badge PRO dans Réglages', await dlg().getByText('PRO', { exact: true }).isVisible());

  // Service client
  await tapRow('Service client');
  check('Service client : ligne prioritaire Pro', await dlg().getByText(/Ligne prioritaire Pro/).isVisible());
  check('Service client : bouton Appeler (tel:)', (await dlg().locator('a[href^="tel:+221"]').count()) === 1);
  check('Service client : bouton WhatsApp', (await dlg().locator('a[href^="https://wa.me/"]').count()) === 1);
  await dlg().getByText('Quels sont les frais ?').tap();
  check('Service client : réponse dépliée', await dlg().getByText(/1 % du montant/).isVisible());
  await p.keyboard.press('Escape');
  await p.waitForTimeout(250);

  // Ajouter un compte : validations
  const colyCard = (await get('card')).fullNumber;
  await tapRow('Ajouter un autre compte');
  await dlg().getByRole('button', { name: 'Professionnel', exact: true }).tap();
  await p.getByRole('button', { name: 'Créer le compte' }).tap();
  check('Ajout : nom obligatoire', await dlg().getByText("Entrez le nom de l'entreprise").isVisible());
  await dlg().locator('input').nth(0).fill('Sene Digital');
  await dlg().locator('input[type=tel]').fill('78 302 35 14');
  await p.getByRole('button', { name: 'Créer le compte' }).tap();
  check('Ajout : numéro déjà utilisé refusé', await dlg().getByText('Ce numéro a déjà un compte sur cet appareil').isVisible());
  await dlg().locator('input[type=tel]').fill('77 123 45 67');
  await p.getByRole('button', { name: 'Créer le compte' }).tap();
  await p.waitForLoadState('load');
  await p.waitForTimeout(900);
  check('Nouveau compte : app rouverte sans code', (await p.getByRole('button', { name: '1', exact: true }).count()) === 0);
  check('Nouveau compte : message « Compte Sene Digital créé »', (await p.getByText('Compte Sene Digital créé').count()) === 1);
  check('Nouveau compte : solde 0', (await get('balance')) === 0);
  check('Nouveau compte : historique vide', (await get('transactions')).length === 0 && (await p.getByText('Aucune opération').count()) === 1);
  const sene = await get('user');
  check('Nouveau compte : profil professionnel', sene.name === 'Sene Digital' && sene.accountType === 'business' && sene.phone === '+221 77 123 45 67');
  check('Nouveau compte : carte neuve', (await get('card')).fullNumber !== colyCard);

  // Limite du plan Gratuit (2 comptes)
  await openSettings();
  check('Sene Digital : badge GRATUIT', await dlg().getByText('GRATUIT', { exact: true }).isVisible());
  await tapRow('Ajouter un autre compte');
  check('Gratuit : limite de 2 comptes', await dlg().getByText('2 comptes au maximum').isVisible());
  await p.keyboard.press('Escape');
  await p.waitForTimeout(250);

  // Retour sur COLY SENE : données intactes
  await tapRow('COLY SENE');
  await dlg().getByRole('button', { name: 'Utiliser ce compte' }).tap();
  await p.waitForLoadState('load');
  await p.waitForTimeout(900);
  check('Bascule : solde de COLY SENE retrouvé', (await get('balance')) === start - 2500, String(await get('balance')));
  check('Bascule : historique retrouvé', (await get('transactions')).length > 10);
  check('Bascule : carte retrouvée', (await get('card')).fullNumber === colyCard);
  check('Bascule : toujours Pro', (await get('user')).plan === 'pro');

  // Retirer le compte Sene Digital
  await openSettings();
  await tapRow('Sene Digital');
  await dlg().getByRole('button', { name: 'Retirer de cet appareil' }).tap();
  await dlg().getByRole('button', { name: 'Retirer définitivement' }).tap();
  await p.waitForTimeout(300);
  check('Retrait : compte supprimé de la liste', (await dlg().getByText('Sene Digital').count()) === 0);
  check('Retrait : données supprimées', await p.evaluate(() => !Object.keys(localStorage).some((k) => k.startsWith('payzed_acct_'))));

  // Se déconnecter
  await tapRow('Se déconnecter');
  await dlg().getByRole('button', { name: 'Se déconnecter', exact: true }).tap();
  await p.waitForTimeout(400);
  check('Déconnexion : écran du code PIN', (await p.getByRole('button', { name: '1', exact: true }).count()) === 1);
  await unlock();

  // Profil : badge Pro, plus de doublon « Verrouiller »
  await p.getByRole('button', { name: 'Profil', exact: true }).tap();
  await p.waitForTimeout(300);
  check('Profil : badge PRO', (await p.locator('.app-scroll').getByText('PRO', { exact: true }).count()) === 1);
  check('Profil : « Verrouiller l’application » retiré (remplacé par Se déconnecter)', (await p.getByText("Verrouiller l'application").count()) === 0);

  // Logos commerçants fournis
  const logos = await p.evaluate(async () =>
    Promise.all(['merchant-pathe.png', 'merchant-yumyum.png', 'merchant-cafederome.png'].map(async (f) => (await fetch('/logos/tiles/' + f)).headers.get('content-type'))),
  );
  check('Logos Pathé, Yum Yum, Café de Rome servis', logos.every((t) => t && t.startsWith('image/')), logos.join(','));

  check('Aucune erreur JavaScript', errs.length === 0, errs.join(' | '));
  console.log(`${pass} OK / ${fail} échec(s)`);
  await b.close();
})();
