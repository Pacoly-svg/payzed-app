import React, { useEffect, useState } from 'react';
import { Archive, ArchiveRestore, Check, Copy, CreditCard, FileText, Share2 } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency, formatTransactionDate } from '../../utils/formatters';
import { renderReceipt } from '../../utils/receipt';
import { shareImage } from '../../utils/share';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { ICONS } from '../comptes/RecentTransactions';
import { Button, List, Row } from '../ui';
import type { Transaction } from '../../types/banking';
import { STATUS_LABEL, STATUS_STYLE, formatDuration } from '../../utils/status';
import { useDemo } from '../../context/DemoContext';

const ReceiptView: React.FC<{ tx: Transaction; onBack: () => void; onClose: () => void }> = ({ tx, onBack, onClose }) => {
  const { user, showToast } = useBanking();
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    renderReceipt(tx, user.name)
      .then((url) => alive && setSrc(url))
      .catch(() => alive && showToast('Impossible de générer le reçu'));
    return () => {
      alive = false;
    };
  }, [tx, user.name, showToast]);

  const share = async () => {
    if (!src) return;
    setBusy(true);
    const res = await shareImage(src, `Recu-Payzed-${tx.reference}.png`, 'Reçu Payzed');
    setBusy(false);
    if (res === 'downloaded') showToast('Reçu téléchargé');
  };

  return (
    <Sheet
      title="Reçu"
      onBack={onBack}
      onClose={onClose}
      footer={
        <Button className="w-full" icon={<Share2 className="w-5 h-5" />} onClick={share} disabled={!src || busy}>
          Partager le reçu
        </Button>
      }
    >
      {src ? (
        <img src={src} alt={`Reçu ${tx.reference}`} className="w-full rounded-3xl border border-neutral-100" />
      ) : (
        <div className="aspect-[3/4] rounded-3xl bg-neutral-100 animate-pulse" />
      )}
    </Sheet>
  );
};

export const TransactionDetailsModal: React.FC = () => {
  const { selectedTransaction: tx, setSelectedTransaction, toggleArchiveTransaction, showToast } = useBanking();
  const { cancelSim } = useDemo();
  const [copied, setCopied] = useState(false);
  // Compte à rebours vivant tant qu'une opération SIM est en cours
  const [, setTick] = useState(0);
  const liveSim = Boolean(tx?.sim && !tx.sim.settled && tx.status !== 'cancelled');
  useEffect(() => {
    if (!liveSim) return;
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [liveSim]);
  const [showReceipt, setShowReceipt] = useState(false);
  if (!tx) return null;

  const close = () => setSelectedTransaction(null);
  if (showReceipt) return <ReceiptView tx={tx} onBack={() => setShowReceipt(false)} onClose={close} />;

  const Icon = ICONS[tx.icon] ?? CreditCard;

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(tx.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast('Copie impossible');
    }
  };

  const unsettledSim = tx.sim && !tx.sim.settled && tx.status !== 'cancelled';
  const rows: [string, string | undefined][] = [
    ['Statut', STATUS_LABEL[tx.status]],
    ...(tx.code ? ([['Code de retrait', tx.code]] as [string, string][]) : []),
    ...(unsettledSim ? ([['Résultat prévu', new Date(tx.sim!.resolveAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })]] as [string, string][]) : []),
    ['Date', formatTransactionDate(tx.timestamp)],
    [tx.amount > 0 ? 'De' : 'À', tx.amount > 0 ? tx.sender : tx.recipient],
    ['Moyen', tx.paymentMethod],
    ['Frais', tx.fee ? formatCurrency(tx.fee, tx.currency) : 'Gratuit'],
    ...(tx.amount < 0 && tx.fee ? ([['Total débité', formatCurrency(Math.abs(tx.amount) + tx.fee, tx.currency)]] as [string, string][]) : []),
    ...(tx.isSimulated ? ([['Type', 'Opération simulée']] as [string, string][]) : []),
  ];

  return (
    <Sheet title="Détail" onClose={close}>
      <div className="flex flex-col items-center text-center pb-6">
        {tx.brandLogo ? (
          <BrandLogo brand={tx.brandLogo} size={64} className="rounded-3xl" />
        ) : (
          <span className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center">
            <Icon className="w-7 h-7" />
          </span>
        )}
        <p className="mt-4 text-[15px] font-semibold">{tx.title}</p>
        <p className={`mt-1 text-[32px] font-extrabold tracking-tight ${tx.status === 'failed' ? 'text-red-600 line-through decoration-2' : ''}`}>
          {formatCurrency(tx.amount, tx.currency, { showSign: true })}
        </p>
        <p className="text-[13px] text-neutral-500 mt-0.5">{tx.subtitle}</p>
        {tx.status !== 'completed' && (
          <span className={`mt-3 text-[13px] font-bold px-3 py-1 rounded-full ${STATUS_STYLE[tx.status]}`}>
            {STATUS_LABEL[tx.status]}
            {unsettledSim && ` · ${formatDuration(tx.sim!.resolveAt - Date.now())}`}
          </span>
        )}
      </div>

      <List>
        {rows
          .filter(([, v]) => Boolean(v))
          .map(([k, v]) => (
            <Row
              key={k}
              title={<span className="text-neutral-500 font-medium">{k}</span>}
              trailing={<span className="text-[15px] font-semibold text-right max-w-[60%] break-words">{v}</span>}
            />
          ))}
        <Row
          onClick={copyRef}
          title={<span className="text-neutral-500 font-medium">Référence</span>}
          trailing={
            <span className="flex items-center gap-2 text-[15px] font-semibold tabular-nums">
              {tx.reference}
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-neutral-400" />}
            </span>
          }
        />
      </List>

      <div className="space-y-2 mt-5">
        {unsettledSim ? (
          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              cancelSim(tx.id);
            }}
          >
            Annuler l'opération
          </Button>
        ) : (
          <Button className="w-full" icon={<FileText className="w-5 h-5" />} onClick={() => setShowReceipt(true)}>
            Voir le reçu
          </Button>
        )}
        <Button
          variant="secondary"
          className="w-full"
          icon={tx.isArchived ? <ArchiveRestore className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
          onClick={() => {
            toggleArchiveTransaction(tx.id);
            showToast(tx.isArchived ? "Remise dans l'historique" : "Masquée de l'historique");
            close();
          }}
        >
          {tx.isArchived ? "Remettre dans l'historique" : "Masquer de l'historique"}
        </Button>
      </div>
    </Sheet>
  );
};
