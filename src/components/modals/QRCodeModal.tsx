import React, { useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import { Check, Copy, Share2 } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { Sheet } from '../common/Sheet';
import { Button } from '../ui';

/** Vrai QR code (scannable) dessiné en SVG. */
const QrCode: React.FC<{ value: string }> = ({ value }) => {
  const { size, path } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { size: n, path: d };
  }, [value]);

  return (
    <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} className="w-full h-full" shapeRendering="crispEdges" role="img" aria-label="QR code">
      <rect x={-2} y={-2} width={size + 4} height={size + 4} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
};

export const QRCodeModal: React.FC = () => {
  const { setActiveModal, user, showToast } = useBanking();
  const [copied, setCopied] = useState(false);
  const close = () => setActiveModal(null);
  const payload = `PAYZED:${user.tag}:${user.phone.replace(/\s/g, '')}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(user.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast('Copie impossible');
    }
  };

  const share = async () => {
    const text = `Envoyez-moi de l'argent sur Payzed : ${user.name} · ${user.phone}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Payzed', text });
      else {
        await navigator.clipboard.writeText(text);
        showToast('Coordonnées copiées');
      }
    } catch {
      // partage annulé
    }
  };

  return (
    <Sheet title="Recevoir de l'argent" onClose={close}>
      <div className="text-center">
        <div className="mx-auto w-full max-w-[240px] aspect-square rounded-3xl border-2 border-neutral-100 p-3">
          <QrCode value={payload} />
        </div>
        <p className="mt-5 text-xl font-bold">{user.name}</p>
        <p className="text-[15px] text-neutral-500 mt-0.5">{user.phone}</p>
        <p className="mt-3 text-[13px] text-neutral-500">Faites scanner ce code pour recevoir un paiement Payzed.</p>
        <div className="grid grid-cols-2 gap-2 mt-6">
          <Button variant="secondary" icon={copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />} onClick={copy}>
            {copied ? 'Copié' : 'Copier'}
          </Button>
          <Button icon={<Share2 className="w-5 h-5" />} onClick={share}>
            Partager
          </Button>
        </div>
      </div>
    </Sheet>
  );
};
