// Responsive : aucun élément ne dépasse de l'écran, sur 5 largeurs Android.
const { chromium, devices } = require('playwright');
const S = process.argv[2] || require('os').tmpdir(); // dossier des captures
const URL = process.env.PAYZED_URL || 'http://localhost:4173/';

const overflowCheck = () => {
  const W = window.innerWidth;
  const bad = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    // ignorer les contenus volontairement défilants horizontalement
    if (el.closest('.no-scrollbar') || el.closest('.overflow-x-auto')) return;
    const st = getComputedStyle(el);
    if (st.visibility === 'hidden' || st.display === 'none' || st.backfaceVisibility === 'hidden' && el.closest('.card-flip:not(.is-flipped) .card-face-back')) return;
    if (r.right > W + 1 || r.left < -1) bad.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} [${Math.round(r.left)}→${Math.round(r.right)}]`);
    // texte qui déborde de sa boîte sans être tronqué
    if (el.children.length === 0 && el.scrollWidth > el.clientWidth + 1 && st.overflow === 'visible' && st.whiteSpace === 'nowrap') {
      const parent = el.parentElement.getBoundingClientRect();
      if (r.right > parent.right + 1) bad.push(`texte: "${el.textContent.slice(0, 30)}" dépasse`);
    }
  });
  return [...new Set(bad)].slice(0, 6);
};

(async () => {
  const b = await chromium.launch();
  let issues = 0;
  for (const w of [320, 360, 393, 412, 480]) {
    const ctx = await b.newContext({ ...devices['Galaxy S9+'], viewport: { width: w, height: 800 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.goto(URL);
    await p.evaluate(() => localStorage.clear());
    await p.reload();
    await p.waitForTimeout(500);
    for (const d of ['1', '2', '3', '4']) await p.getByRole('button', { name: d, exact: true }).tap();
    await p.waitForTimeout(300);
    const report = async (label) => {
      const bad = await p.evaluate(overflowCheck);
      if (bad.length) {
        issues++;
        console.log(`${w}px ${label}:`, bad.join(' | '));
      }
    };
    for (const tab of ['Accueil', 'Stats', 'Carte', 'Profil']) {
      await p.getByRole('button', { name: tab, exact: true }).tap();
      await p.waitForTimeout(400);
      await report(tab);
      if (tab === 'Carte') {
        await p.screenshot({ path: `${S}/card_${w}.png` });
        await p.getByRole('button', { name: 'Infos' }).tap();
        await p.waitForTimeout(800);
        await report('Carte (verso)');
        await p.screenshot({ path: `${S}/cardback_${w}.png` });
        await p.getByRole('button', { name: 'Masquer' }).tap();
        await p.waitForTimeout(700);
      }
    }
    await p.getByRole('button', { name: 'Accueil', exact: true }).tap();
    for (const sheet of ['Envoyer', 'Recevoir', 'Retirer', 'Crédit', 'Factures', 'Épargne', 'Tous les services']) {
      await p.getByRole('button', { name: sheet, exact: sheet !== 'Envoyer' && sheet !== 'Tous les services' }).first().tap();
      await p.waitForTimeout(450);
      await report(`fenêtre ${sheet}`);
      if (w === 360 && sheet === 'Tous les services') await p.screenshot({ path: `${S}/services_${w}.png` });
      await p.locator('[role=dialog] button[aria-label=Fermer]').last().tap();
      await p.waitForTimeout(250);
    }
    await ctx.close();
  }
  console.log(issues ? `${issues} écran(s) avec débordement` : 'Aucun débordement sur 320 / 360 / 393 / 412 / 480 px');
  await b.close();
})();
