import React, { useEffect, useMemo, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import { Camera, Check, Copy, Share2 } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, FeeSummary, Segmented, SuccessView, TextLink, parseAmount } from '../ui';
import { feeFor } from '../../utils/fees';
import { shareText } from '../../utils/share';

type Mode = 'pay' | 'receive';
interface Payee {
  name: string;
  phone: string;
}

/* ---------- Format du QR Payzed : PAYZED:<nom>:<téléphone> ---------- */

const encodePayload = (name: string, phone: string) => `PAYZED:${encodeURIComponent(name)}:${phone.replace(/\s/g, '')}`;

function decodePayload(raw: string): Payee | null {
  const text = raw.trim();
  const m = /^PAYZED:([^:]*):(\+?\d{6,15})$/i.exec(text);
  if (m) {
    let name = m[1];
    try {
      name = decodeURIComponent(m[1]);
    } catch {
      // garder tel quel
    }
    return { name: name.replace(/^@/, '') || 'Contact Payzed', phone: m[2] };
  }
  const digits = text.replace(/[^\d+]/g, '');
  if (/^\+?\d{9,15}$/.test(digits)) return { name: 'Contact', phone: digits };
  return null;
}

/** +221773198812 → +221 77 319 88 12 */
const prettyPhone = (p: string) => {
  const m = /^(\+221)?(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(p.replace(/\s/g, ''));
  return m ? [m[1], m[2], m[3], m[4], m[5]].filter(Boolean).join(' ') : p;
};

/* ---------- Mon code (recevoir) ---------- */

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
    <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} className="w-full h-full" shapeRendering="crispEdges" role="img" aria-label="Mon QR code">
      <rect x={-2} y={-2} width={size + 4} height={size + 4} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
};

const ReceiveView: React.FC = () => {
  const { user, showToast } = useBanking();
  const [copied, setCopied] = useState(false);

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
    const res = await shareText('Payzed', `Envoyez-moi de l'argent sur Payzed : ${user.name} · ${user.phone}`);
    if (res === 'copied') showToast('Coordonnées copiées');
  };

  return (
    <div className="text-center">
      <div className="mx-auto w-full max-w-[240px] aspect-square rounded-3xl border-2 border-neutral-100 p-3">
        <QrCode value={encodePayload(user.name, user.phone)} />
      </div>
      <p className="mt-5 text-xl font-bold">{user.name}</p>
      <p className="text-[15px] text-neutral-500 mt-0.5">{user.phone}</p>
      <p className="mt-3 text-[13px] text-neutral-500">Montrez ce code : la personne le scanne avec Payzed pour vous payer.</p>
      <div className="grid grid-cols-2 gap-2 mt-6">
        <Button variant="secondary" icon={copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />} onClick={copy}>
          {copied ? 'Copié' : 'Copier'}
        </Button>
        <Button icon={<Share2 className="w-5 h-5" />} onClick={share}>
          Partager
        </Button>
      </div>
    </div>
  );
};

/* ---------- Scanner (payer) ---------- */

type BarcodeDetectorLike = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

const Scanner: React.FC<{ onResult: (p: Payee) => void }> = ({ onResult }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'starting' | 'scanning' | 'denied' | 'unavailable'>('starting');
  const [invalid, setInvalid] = useState(false);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    let lastInvalid = '';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) return setStatus('unavailable');
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      } catch {
        return setStatus('denied');
      }
      if (stopped) return stream.getTracks().forEach((t) => t.stop());
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play().catch(() => undefined);
      setStatus('scanning');

      // Détecteur natif si disponible, sinon décodeur jsQR (chargé à la demande)
      const Native = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike }).BarcodeDetector;
      const native = Native ? new Native({ formats: ['qr_code'] }) : null;
      const jsQR = native ? null : (await import('jsqr')).default;

      const tick = async () => {
        if (stopped) return;
        if (video.readyState >= 2 && ctx) {
          let raw: string | null = null;
          try {
            if (native) {
              const codes = await native.detect(video);
              raw = codes[0]?.rawValue ?? null;
            } else if (jsQR) {
              const w = 480;
              const h = Math.round((video.videoHeight / video.videoWidth) * w) || w;
              canvas.width = w;
              canvas.height = h;
              ctx.drawImage(video, 0, 0, w, h);
              raw = jsQR(ctx.getImageData(0, 0, w, h).data, w, h)?.data ?? null;
            }
          } catch {
            raw = null;
          }
          if (raw) {
            const payee = decodePayload(raw);
            if (payee) {
              try {
                navigator.vibrate?.(40);
              } catch {
                // ignore
              }
              stopped = true;
              stream?.getTracks().forEach((t) => t.stop());
              onResultRef.current(payee);
              return;
            }
            if (raw !== lastInvalid) {
              lastInvalid = raw;
              setInvalid(true);
            }
          }
        }
        raf = requestAnimationFrame(() => void tick());
      };
      raf = requestAnimationFrame(() => void tick());
    };

    void start();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative mx-auto w-full max-w-[300px] aspect-square rounded-3xl overflow-hidden bg-black">
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        {status === 'scanning' && (
          <div className="absolute inset-[15%] rounded-3xl border-[3px] border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        )}
        {status !== 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <Camera className="w-8 h-8" />
            <p className="text-[15px] font-semibold">
              {status === 'starting' && 'Ouverture de la caméra…'}
              {status === 'denied' && 'Autorisez la caméra pour scanner'}
              {status === 'unavailable' && 'Caméra indisponible'}
            </p>
            {status === 'denied' && <p className="text-[13px] text-white/70">Paramètres du téléphone → Applis → Payzed → Autorisations</p>}
          </div>
        )}
      </div>
      <p className="text-center text-[15px] text-neutral-500">
        {invalid ? "Ce QR code n'est pas un code de paiement Payzed" : 'Visez le QR code de la personne à payer'}
      </p>
    </div>
  );
};

const PayForm: React.FC<{ payee: Payee; onDone: () => void; onCancel: () => void }> = ({ payee, onDone, onCancel }) => {
  const { balance, addTransaction, showToast } = useBanking();
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState<number | null>(null);
  const value = parseAmount(amount);
  const fee = feeFor(value);
  const initials = payee.name.split(/\s+/).map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase();

  if (done !== null) return <SuccessView amount={formatCurrency(done, 'XOF')} text={`payés à ${payee.name}`} onDone={onDone} />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!(value > 0)) return showToast('Entrez un montant');
        if (value + fee > balance) return showToast('Solde insuffisant (frais compris)');
        addTransaction({
          title: payee.name,
          subtitle: 'Paiement par QR code',
          category: 'Revenus & Virements',
          type: 'transfer_out',
          amount: -value,
          status: 'completed',
          icon: 'ArrowUpRight',
          recipient: `${payee.name} · ${prettyPhone(payee.phone)}`,
          recipientPhone: payee.phone,
          fee,
          paymentMethod: 'QR code Payzed',
        });
        triggerSuccessConfetti();
        setDone(value);
      }}
      className="space-y-5"
    >
      <div className="flex flex-col items-center text-center">
        <span className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold">{initials}</span>
        <p className="mt-3 text-xl font-bold">{payee.name}</p>
        <p className="text-[15px] text-neutral-500">{prettyPhone(payee.phone)}</p>
      </div>
      <AmountField value={amount} onChange={setAmount} autoFocus hint={`Disponible : ${formatCurrency(balance, 'XOF')}`} />
      {value > 0 && <FeeSummary amount={value} fee={fee} balance={balance} />}
      <Button type="submit" className="w-full" disabled={!(value > 0) || value + fee > balance}>
        {value > 0 ? `Payer ${formatCurrency(value, 'XOF')}` : 'Payer'}
      </Button>
      <Button variant="ghost" className="w-full" onClick={onCancel}>
        Scanner un autre code
      </Button>
    </form>
  );
};

/* ---------- Fenêtre ---------- */

export const QRCodeModal: React.FC = () => {
  const { activeModal, setActiveModal } = useBanking();
  const [mode, setMode] = useState<Mode>(activeModal === 'scan' ? 'pay' : 'receive');
  const [payee, setPayee] = useState<Payee | null>(null);
  const close = () => setActiveModal(null);

  if (payee) {
    return (
      <Sheet title="Payer" onClose={close} onBack={() => setPayee(null)}>
        <PayForm payee={payee} onDone={close} onCancel={() => setPayee(null)} />
      </Sheet>
    );
  }

  return (
    <Sheet title="QR code" onClose={close}>
      <div className="space-y-6">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { id: 'pay', label: 'Payer' },
            { id: 'receive', label: 'Recevoir' },
          ]}
        />
        {mode === 'pay' ? (
          <>
            <Scanner onResult={setPayee} />
            <TextLink className="w-full text-center" onClick={() => setActiveModal('transfer')}>
              Pas de QR code ? Envoyer à un numéro
            </TextLink>
          </>
        ) : (
          <ReceiveView />
        )}
      </div>
    </Sheet>
  );
};
