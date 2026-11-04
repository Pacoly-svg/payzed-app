// Retrait, reçu, recherche, logos, scan QR (caméra simulée), lien profond.
const { chromium, devices } = require('playwright');
const S = process.argv[2] || require('os').tmpdir(); // dossier des captures
const URL = process.env.PAYZED_URL || 'http://localhost:4173/';
let pass = 0, fail = 0;
const check = (label, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'OK ' : 'ÉCHEC'} ${label} ${extra}`); };

/** Vidéo de caméra simulée montrant un QR « payzed://pay?… » (nécessite ffmpeg + ImageMagick). */
function makeFakeCamera(dir) {
  const fs = require('fs');
  const { execSync } = require('child_process');
  const out = `${dir}/qr_link.y4m`;
  if (fs.existsSync(out)) return out;
  const qrcode = require('qrcode-generator');
  const q = qrcode(0, 'M');
  q.addData('payzed://pay?name=Aminata%20Fall&tel=%2B221765123456');
  q.make();
  const n = q.getModuleCount(), cell = 8, m = 4, W = (n + 2 * m) * cell;
  const rows = [];
  for (let y = 0; y < W; y++) {
    let r = '';
    for (let x = 0; x < W; x++) {
      const c = Math.floor(x / cell) - m, rr = Math.floor(y / cell) - m;
      r += c >= 0 && rr >= 0 && c < n && rr < n && q.isDark(rr, c) ? '0 ' : '255 ';
    }
    rows.push(r);
  }
  fs.writeFileSync(`${dir}/qr_link.pgm`, `P2\n${W} ${W}\n255\n${rows.join('\n')}`);
  execSync(`convert ${dir}/qr_link.pgm -gravity center -background white -extent 640x480 ${dir}/qr_link.png`);
  execSync(`ffmpeg -loglevel error -y -loop 1 -i ${dir}/qr_link.png -t 2 -pix_fmt yuv420p -r 15 ${out}`);
  return out;
}

(async () => {
  makeFakeCamera(S);
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${S}/qr_link.y4m`] });
  const ctx = await b.newContext({ ...devices['Galaxy S9+'], viewport: { width: 384, height: 832 }, deviceScaleFactor: 2, permissions: ['camera'] });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const bal = () => p.evaluate(() => JSON.parse(localStorage.getItem('payzed_balance')));
  await p.goto(URL);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);
  for (const d of ['1', '2', '3', '4']) await p.getByRole('button', { name: d, exact: true }).tap();
  await p.waitForTimeout(300);
  const title = () => p.locator('[role=dialog] h2').last().innerText();

  // Retrait chez un agent
  const b0 = await bal();
  await p.getByRole('button', { name: 'Retirer', exact: true }).tap();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: 'Chez un agent' }).tap();
  await p.locator('[role=dialog] input[inputmode=numeric]').fill('20000');
  await p.getByRole('button', { name: 'Continuer' }).tap();
  await p.waitForTimeout(300);
  check('Retrait : étape de vérification', (await title()) === 'Vérifier le retrait');
  await p.getByRole('button', { name: 'Confirmer le retrait' }).tap();
  await p.waitForTimeout(1100);
  const code = await p.locator('[role=dialog] .tabular-nums').first().innerText();
  check('Retrait : code agent à 6 chiffres affiché', /^\d{3} \d{3}$/.test(code), code);
  check('Retrait : 20 000 + 200 de frais débités', b0 - (await bal()) === 20200);
  await p.getByRole('button', { name: 'Terminé' }).tap();
  await p.waitForTimeout(300);

  // Détail + reçu de ce retrait
  await p.locator('.app-scroll button:has-text("Retrait chez un agent")').first().tap();
  await p.waitForTimeout(300);
  check('Détail : code de retrait visible', await p.locator('[role=dialog]').getByText(code, { exact: true }).isVisible());
  await p.getByRole('button', { name: 'Voir le reçu' }).tap();
  await p.waitForTimeout(1200);
  const receiptOk = await p.locator('[role=dialog] img[alt^="Reçu"]').evaluate((img) => img.complete && img.naturalWidth === 1080);
  check('Reçu PNG généré (1080 px)', receiptOk);
  await p.keyboard.press('Escape');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);

  // Recherche + logos
  await p.getByRole('button', { name: /Tous les services/ }).tap();
  await p.waitForTimeout(500);
  const logos = await p.locator('[role=dialog] img').evaluateAll((imgs) => imgs.map((i) => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 })));
  const broken = logos.filter((l) => !l.ok);
  check(`Logos du catalogue chargés (${logos.length - broken.length}/${logos.length})`, broken.length === 0, broken.map((x) => x.src).join(', '));
  const sizes = await p.locator('[role=dialog] section span[title]').evaluateAll((els) => [...new Set(els.map((e) => `${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`))]);
  check('Tous les logos ont exactement la même taille', sizes.length === 1, sizes.join(' '));
  await p.locator('[role=dialog] input[type=search]').fill('senelec');
  await p.waitForTimeout(200);
  check('Recherche « senelec » : Senelec + Woyofal', (await p.locator('[role=dialog] section button').count()) === 2);
  await p.locator('[role=dialog] input[type=search]').fill('orange');
  await p.getByRole('button', { name: 'Par opérateur' }).tap();
  await p.waitForTimeout(200);
  check('Recherche « orange » par opérateur : Orange', (await p.locator('[role=dialog] button:has(svg.lucide-chevron-right)').count()) === 1);
  await p.locator('[role=dialog] input[type=search]').fill('zzzz');
  check('Recherche sans résultat : message clair', await p.getByText('Aucun résultat').isVisible());
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);

  // Scan d'un QR « payzed://pay?… » avec la caméra simulée
  await p.getByRole('button', { name: 'Scanner un QR code pour payer' }).tap();
  await p.waitForTimeout(3500);
  check('Scan QR (lien profond) : bénéficiaire reconnu', await p.locator('[role=dialog]').getByText('Aminata Fall').isVisible());
  check('Scan QR : numéro formaté', await p.locator('[role=dialog]').getByText('+221 76 512 34 56').isVisible());
  await p.screenshot({ path: `${S}/z_scan.png` });

  check('Aucune erreur JavaScript', errs.length === 0, errs.join(' | '));
  console.log(`${pass} OK / ${fail} échec(s)`);
  await b.close();
})();
