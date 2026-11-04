import qrcode from 'qrcode-generator';
import { PAYZED_LOGO_PATHS, PAYZED_LOGO_VIEWBOX } from '../components/common/PayzedLogo';
import { formatCurrency } from './formatters';
import type { Transaction } from '../types/banking';

/*
 * Reçu Payzed dessiné en PNG (aucune librairie) : prêt à partager sur WhatsApp,
 * enregistrer dans la galerie ou envoyer par e-mail.
 */

const W = 1080;
const PAD = 84;
const FONT = 'system-ui, -apple-system, Roboto, "Segoe UI", Arial, sans-serif';

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const logoSvg = () =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${PAYZED_LOGO_VIEWBOX}"><g fill="#000">${PAYZED_LOGO_PATHS.map((d) => `<path d="${d}"/>`).join('')}</g></svg>`,
  )}`;

const fullDate = (ts: number) =>
  new Date(ts).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Coupe un texte trop long pour tenir dans maxWidth. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

export async function renderReceipt(tx: Transaction, holderName: string): Promise<string> {
  const isIn = tx.amount > 0;
  const fee = isIn ? 0 : tx.fee || 0;
  const amount = Math.abs(tx.amount);

  const rows: [string, string][] = [
    ['Date', fullDate(tx.timestamp)],
    [isIn ? 'Expéditeur' : 'Bénéficiaire', (isIn ? tx.sender : tx.recipient) || tx.title],
    [isIn ? 'Bénéficiaire' : 'Émetteur', holderName],
    ['Moyen', tx.paymentMethod || 'Payzed'],
    ['Montant', formatCurrency(amount, tx.currency)],
    ['Frais', fee ? formatCurrency(fee, tx.currency) : 'Gratuit'],
  ];
  if (!isIn) rows.push(['Total débité', formatCurrency(amount + fee, tx.currency)]);
  rows.push(['Référence', tx.reference]);

  const rowH = 92;
  const H = 590 + rows.length * rowH + 10 + 220 + 150 + (tx.isSimulated ? 50 : 0);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Fond
  ctx.fillStyle = '#F4F4F5';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(40, 40, W - 80, H - 80, 48);
  else ctx.rect(40, 40, W - 80, H - 80);
  ctx.fill();

  // Logo
  try {
    const logo = await loadImage(logoSvg());
    const lh = 64;
    const lw = (1100 / 364.436) * lh;
    ctx.drawImage(logo, (W - lw) / 2, 110, lw, lh);
  } catch {
    ctx.fillStyle = '#000';
    ctx.font = `800 64px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('Payzed', W / 2, 165);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#71717A';
  ctx.font = `600 34px ${FONT}`;
  ctx.fillText('Reçu de paiement', W / 2, 240);

  // Pastille statut
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(W / 2, 320, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 19, 321);
  ctx.lineTo(W / 2 - 5, 335);
  ctx.lineTo(W / 2 + 21, 307);
  ctx.stroke();

  // Montant
  ctx.fillStyle = '#000';
  ctx.font = `800 92px ${FONT}`;
  ctx.fillText(`${isIn ? '+' : '-'}${formatCurrency(amount, tx.currency)}`, W / 2, 460);
  ctx.fillStyle = '#16A34A';
  ctx.font = `700 32px ${FONT}`;
  ctx.fillText(isIn ? 'Argent reçu' : 'Paiement réussi', W / 2, 512);

  // Lignes
  let y = 590;
  ctx.font = `500 34px ${FONT}`;
  rows.forEach(([k, v], i) => {
    if (i > 0) {
      ctx.strokeStyle = '#EDEDED';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PAD + 40, y - rowH + 28);
      ctx.lineTo(W - PAD - 40, y - rowH + 28);
      ctx.stroke();
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = '#71717A';
    ctx.font = `500 34px ${FONT}`;
    ctx.fillText(k, PAD + 40, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#000';
    ctx.font = `${k === 'Total débité' ? 800 : 600} 34px ${FONT}`;
    ctx.fillText(fit(ctx, v, 560), W - PAD - 40, y);
    y += rowH;
  });

  // QR de la référence
  const qr = qrcode(0, 'M');
  qr.addData(`PAYZED-REF:${tx.reference}`);
  qr.make();
  const n = qr.getModuleCount();
  const size = 220;
  const cell = size / n;
  const qx = (W - size) / 2;
  const qy = y + 10;
  ctx.fillStyle = '#000';
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect(qx + c * cell, qy + r * cell, Math.ceil(cell), Math.ceil(cell));

  ctx.textAlign = 'center';
  ctx.fillStyle = '#A1A1AA';
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText(`Généré par Payzed le ${fullDate(Date.now())}`, W / 2, qy + size + 70);
  if (tx.isSimulated) {
    ctx.fillText('Opération simulée — document de démonstration', W / 2, qy + size + 115);
  }

  return canvas.toDataURL('image/png');
}
