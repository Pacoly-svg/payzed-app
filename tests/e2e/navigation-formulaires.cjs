// Navigation Retour (touche Échap = même pile que le bouton Retour Android) + formulaires
const { chromium, devices } = require('playwright');
const S = process.argv[2] || require('os').tmpdir(); // dossier des captures
const URL = process.env.PAYZED_URL || 'http://localhost:4173/';
let pass = 0, fail = 0;
const check = (label, cond) => { cond ? pass++ : fail++; console.log(`${cond ? 'OK ' : 'ÉCHEC'} ${label}`); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Galaxy S9+'], viewport: { width: 384, height: 832 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  const back = async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(300); };
  const dialogs = () => p.locator('[role=dialog]').count();
  const title = () => p.locator('[role=dialog] h2').last().innerText();

  // Verrouillage : Retour ne contourne pas le code
  await back();
  check('Retour sur le verrouillage ne déverrouille pas', await p.getByText('Entrez votre code PIN').isVisible());
  for (const d of ['1', '2', '3', '4']) await p.getByRole('button', { name: d, exact: true }).tap();
  await p.waitForTimeout(300);

  // Onglet → Accueil
  await p.getByRole('button', { name: 'Stats', exact: true }).tap();
  await p.waitForTimeout(300);
  await back();
  check('Retour depuis Stats ramène à l’Accueil', (await p.locator('nav [aria-current=page]').innerText()).includes('Accueil'));

  // Accueil : pas de fermeture, message de double appui
  await back();
  check('Retour sur l’Accueil affiche « Appuyez encore… »', await p.getByText('Appuyez encore sur Retour pour quitter').isVisible());

  // Fenêtre vide : se ferme directement
  await p.getByRole('button', { name: 'Factures', exact: true }).tap();
  await p.waitForTimeout(300);
  await back();
  check('Fenêtre sans saisie : Retour la ferme', (await dialogs()) === 0);

  // Fenêtre avec saisie : confirmation avant abandon
  await p.getByRole('button', { name: 'Envoyer' }).first().tap();
  await p.waitForTimeout(300);
  await p.locator('[role=dialog] input[inputmode=numeric]').fill('5000');
  await p.locator('[role=dialog] input[inputmode=numeric]').blur();
  await back();
  check('Saisie en cours : demande de confirmation', await p.getByText("Abandonner l'opération ?").isVisible());
  await back();
  check('Retour sur la confirmation : on reste dans le formulaire', !(await p.getByText("Abandonner l'opération ?").isVisible()) && (await dialogs()) === 1);
  check('Montant conservé', (await p.locator('[role=dialog] input[inputmode=numeric]').inputValue()) === '5 000');

  // Validation : numéro invalide bloque
  await p.locator('[role=dialog] input[placeholder="Nom et prénom"]').fill('Moussa Diallo');
  await p.locator('[role=dialog] input[type=tel]').fill('12345');
  await p.getByRole('button', { name: 'Continuer' }).tap();
  await p.waitForTimeout(200);
  check('Numéro invalide signalé', await p.getByText('Numéro sénégalais à 9 chiffres').isVisible());
  await p.locator('[role=dialog] input[type=tel]').fill('77 123 45 67');
  await p.getByRole('button', { name: 'Continuer' }).tap();
  await p.waitForTimeout(300);
  check('Étape de vérification affichée', (await title()) === "Vérifier l'envoi");
  await back();
  check('Retour depuis la vérification revient au formulaire', (await title()) === "Envoyer de l'argent");
  check('Données conservées après retour', (await p.locator('[role=dialog] input[type=tel]').inputValue()) === '77 123 45 67');
  await p.getByRole('button', { name: 'Continuer' }).tap();
  await p.waitForTimeout(300);
  // Double appui sur Confirmer
  const balanceBefore = await p.evaluate(() => JSON.parse(localStorage.getItem('payzed_balance')));
  const confirm = p.getByRole('button', { name: "Confirmer l'envoi" });
  await confirm.click();
  await confirm.click({ force: true }).catch(() => {});
  await confirm.click({ force: true }).catch(() => {});
  await p.waitForTimeout(1200);
  const balanceAfter = await p.evaluate(() => JSON.parse(localStorage.getItem('payzed_balance')));
  check(`Triple appui = un seul débit (${balanceBefore - balanceAfter} débités, attendu 5 050)`, balanceBefore - balanceAfter === 5050);
  check('Écran de succès', (await title()) === 'Argent envoyé');
  await p.getByRole('button', { name: 'Terminé' }).tap();
  await p.waitForTimeout(300);

  // Sous-écran → écran parent → fermeture
  await p.getByRole('button', { name: 'Épargne', exact: true }).tap();
  await p.waitForTimeout(300);
  await p.locator('[role=dialog] button:has-text("Voyage")').tap();
  await p.waitForTimeout(300);
  await back();
  check('Retour depuis un coffre revient à la liste Épargne', (await title()) === 'Épargne');
  await back();
  check('Retour ferme ensuite Épargne', (await dialogs()) === 0);

  // Services → opérateur → retour
  await p.getByRole('button', { name: /Tous les services/ }).tap();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: 'Par opérateur' }).tap();
  await p.locator('[role=dialog] button:has-text("Orange")').first().tap();
  await p.waitForTimeout(300);
  check('Fiche opérateur Orange : 4 parcours (Orange Money, retrait, crédit, Fibre)', (await p.locator('[role=dialog] button:has(svg.lucide-chevron-right)').count()) === 4);
  await back();
  check('Retour depuis la fiche opérateur revient à la liste', (await title()) === 'Tous les services');
  await back();

  // Carte : Retour masque d'abord les infos
  await p.getByRole('button', { name: 'Carte', exact: true }).tap();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: 'Infos' }).tap();
  await p.waitForTimeout(300);
  await back();
  check('Retour masque les infos de la carte sans quitter l’onglet', (await p.locator('nav [aria-current=page]').innerText()).includes('Carte') && (await p.getByRole('button', { name: 'Infos' }).count()) === 1);

  check('Aucune erreur JavaScript', errs.length === 0);
  console.log(`${pass} OK / ${fail} échec(s)`, errs);
  await b.close();
})();
