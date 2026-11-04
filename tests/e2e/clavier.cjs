// Teste TOUS les champs de saisie avec un clavier simulé (2 modes) sur 2 tailles d'écran.
const { chromium, devices } = require('playwright');
const S = process.argv[2] || require('os').tmpdir(); // dossier des captures
const URL = process.env.PAYZED_URL || 'http://localhost:4173/';

const FAKE_VV = `
  (() => {
    const real = window.visualViewport;
    const listeners = {};
    let fakeH = null;
    const vv = {
      get height() { return fakeH ?? (real ? real.height : innerHeight); },
      get width() { return real ? real.width : innerWidth; },
      get offsetTop() { return 0; }, get offsetLeft() { return 0; }, get scale() { return 1; },
      addEventListener(t, f) { (listeners[t] ||= []).push(f); if (real) real.addEventListener(t, f); },
      removeEventListener() {},
    };
    Object.defineProperty(window, 'visualViewport', { get: () => vv });
    window.__setKb = (h) => { fakeH = h ? innerHeight - h : null; (listeners.resize || []).forEach((f) => f()); };
  })();`;

const SCREENS = [
  { name: 'Envoyer', open: async (p) => p.getByRole('button', { name: 'Envoyer' }).first().tap(), fields: ['input[placeholder="Nom et prénom"]', 'input[type=tel]', 'input[inputmode=numeric]'] },
  { name: 'Crédit', open: async (p) => p.getByRole('button', { name: 'Crédit', exact: true }).tap(), fields: ['input[type=tel]', 'input[inputmode=numeric]'] },
  { name: 'Factures', open: async (p) => { await p.getByRole('button', { name: 'Paiement', exact: true }).tap(); await p.waitForTimeout(300); await p.locator('[role=dialog] button:has-text("Senelec")').first().tap(); }, fields: ['form input:not([inputmode])', 'input[inputmode=numeric]'] },
  { name: 'Paiement', open: async (p) => p.getByRole('button', { name: 'Paiement', exact: true }).tap(), fields: ['input[type=search]'] },
  {
    name: 'Nouveau coffre',
    open: async (p) => {
      await p.getByRole('button', { name: 'Épargne', exact: true }).tap();
      await p.waitForTimeout(300);
      await p.getByRole('button', { name: 'Nouveau coffre' }).tap();
    },
    fields: ['input[maxlength="30"]', 'input[inputmode=numeric]'],
  },
  {
    name: 'Coffre (dépôt)',
    open: async (p) => {
      await p.getByRole('button', { name: 'Épargne', exact: true }).tap();
      await p.waitForTimeout(300);
      await p.locator('[role=dialog] button:has-text("Voyage")').tap();
    },
    fields: ['input[inputmode=numeric]'],
  },
  {
    name: 'Abonnement (ajout)',
    open: async (p) => {
      await p.getByRole('button', { name: 'Paiement', exact: true }).tap();
      await p.waitForTimeout(300);
      await p.locator('[role=dialog] button:has-text("Netflix")').tap();
    },
    fields: ['input:not([inputmode])', 'input[inputmode=numeric]'],
  },
  {
    name: 'Plafond carte',
    tab: 'Carte',
    open: async (p) => p.getByRole('button', { name: 'Plafond' }).tap(),
    fields: ['input[inputmode=numeric]'],
  },
  { name: 'Profil', tab: 'Profil', open: null, fields: ['input[autocomplete=name]', 'input[autocomplete=tel]'] },
  {
    name: 'Code PIN',
    tab: 'Profil',
    open: async (p) => p.getByRole('button', { name: /Changer le code PIN/ }).tap(),
    fields: ['input[type=password] >> nth=0', 'input[type=password] >> nth=1'],
  },
  {
    name: 'SIM',
    tab: 'Profil',
    open: async (p) => p.getByRole('button', { name: /^Simulations/ }).tap(),
    fields: ['input[placeholder="Nom et prénom"]', 'input[type=tel]', 'input[inputmode=numeric] >> nth=0', 'input[aria-label="Durée de traitement"]', 'input[inputmode=numeric] >> nth=1'],
  },
  { name: 'Retrait', open: async (p) => p.getByRole('button', { name: 'Retirer', exact: true }).tap(), fields: ['input[type=tel]', 'input[inputmode=numeric]'] },
];

(async () => {
  const b = await chromium.launch();
  let failures = 0;
  let checks = 0;
  for (const [w, h] of [[360, 740], [412, 915]]) {
    for (const mode of ['resize', 'overlay']) {
      const ctx = await b.newContext({ ...devices['Galaxy S9+'], viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      const p = await ctx.newPage();
      await p.addInitScript(FAKE_VV);
      const errs = [];
      p.on('pageerror', (e) => errs.push(e.message));
      await p.goto(URL);
      await p.evaluate(() => localStorage.clear());
      await p.reload();
      await p.waitForTimeout(500);
      for (const d of ['1', '2', '3', '4']) await p.getByRole('button', { name: d, exact: true }).tap();
      await p.waitForTimeout(300);
      // Mode test (accès SIM)
      await p.evaluate(() => localStorage.setItem('payzed_test_mode', 'true'));
      await p.reload();
      await p.waitForTimeout(400);
      for (const d of ['1', '2', '3', '4']) await p.getByRole('button', { name: d, exact: true }).tap();
      await p.waitForTimeout(300);
      const KB = Math.round(h * 0.42);

      for (const sc of SCREENS) {
        await p.getByRole('button', { name: sc.tab ?? 'Accueil', exact: true }).tap();
        await p.waitForTimeout(250);
        if (sc.open) {
          await sc.open(p);
          await p.waitForTimeout(400);
        }
        const scope = sc.open ? p.locator('[role=dialog]').last() : p.locator('.app-scroll');
        for (const sel of sc.fields) {
          const field = scope.locator(sel).first();
          await field.scrollIntoViewIfNeeded().catch(() => {});
          await field.focus();
          // Ouverture du clavier
          if (mode === 'resize') await p.setViewportSize({ width: w, height: h - KB });
          else await p.evaluate((k) => window.__setKb(k), KB);
          await p.waitForTimeout(950);
          await field.fill('');
          await field.pressSequentially('12', { delay: 20 });
          const visibleBottom = mode === 'resize' ? h - KB : h - KB;
          const box = await field.boundingBox();
          const ok = box && box.y >= 0 && box.y + box.height <= visibleBottom + 1;
          const val = await field.inputValue();
          checks++;
          if (!ok || !val.includes('12')) {
            failures++;
            console.log(`ÉCHEC ${w}x${h} ${mode} | ${sc.name} | ${sel} | box ${box && Math.round(box.y)}-${box && Math.round(box.y + box.height)} visible≤${visibleBottom} val="${val}"`);
            await p.screenshot({ path: `${S}/fail_${w}_${mode}_${sc.name.replace(/\W/g, '')}.png` });
          }
          await field.evaluate((el) => el.blur());
          if (mode === 'resize') await p.setViewportSize({ width: w, height: h });
          else await p.evaluate(() => window.__setKb(0));
          await p.waitForTimeout(250);
        }
        if (sc.open) {
          const closeBtn = p.locator('[role=dialog] button[aria-label=Fermer]');
          if (await closeBtn.count()) await closeBtn.last().tap();
          await p.waitForTimeout(250);
          if (await p.getByText("Abandonner l'opération ?").isVisible()) await p.getByRole('button', { name: 'Abandonner' }).tap();
          await p.waitForTimeout(200);
        }
      }
      if (errs.length) console.log('ERREURS JS', errs);
      await ctx.close();
    }
  }
  console.log(`${checks - failures}/${checks} champs visibles pendant la saisie`);
  await b.close();
})();
