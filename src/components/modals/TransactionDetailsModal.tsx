import React, { useState } from 'react';
import { Archive, ArchiveRestore, Check, Copy, CreditCard } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency, formatTransactionDate } from '../../utils/formatters';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { ICONS } from '../comptes/RecentTransactions';

export const TransactionDetailsModal: React.FC = () => {
  const { selectedTransaction: tx, setSelectedTransaction, toggleArchiveTransaction, showToast } = useBanking();
  const [copied, setCopied] = useState(false);
  if (!tx) return null;

  const close = () => setSelectedTransaction(null);
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

  const rows: [string, string | undefined][] = [
    ['Date', formatTransactionDate(tx.timestamp)],
    [tx.amount > 0 ? 'De' : 'À', tx.amount > 0 ? tx.sender : tx.recipient],
    ['Moyen', tx.paymentMethod],
    ['Frais', tx.fee ? formatCurrency(tx.fee, tx.currency) : 'Gratuit'],
  ];

  return (
    <Sheet title="Détail" onClose={close}>
      <div className="flex flex-col items-center text-center gap-2 pb-5">
        {tx.brandLogo ? (
          <BrandLogo brand={tx.brandLogo} size={56} className="rounded-2xl" />
        ) : (
          <span className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
            <Icon className="w-7 h-7" />
          </span>
        )}
        <p className="font-bold text-base">{tx.title}</p>
        <p className={`text-3xl font-extrabold ${tx.amount > 0 ? 'text-emerald-600' : ''}`}>
          {formatCurrency(tx.amount, tx.currency, { showSign: true })}
        </p>
        <p className="text-sm text-neutral-500">{tx.subtitle}</p>
      </div>

      <div className="rounded-2xl bg-neutral-50 divide-y divide-neutral-100">
        {rows
          .filter(([, v]) => Boolean(v))
          .map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
              <span className="text-neutral-500 shrink-0">{k}</span>
              <span className="font-semibold text-right break-words min-w-0">{v}</span>
            </div>
          ))}
        <button type="button" onClick={copyRef} className="w-full flex justify-between items-center gap-4 px-4 py-3 text-sm">
          <span className="text-neutral-500">Référence</span>
          <span className="font-mono font-semibold flex items-center gap-2">
            {tx.reference}
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-neutral-400" />}
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          toggleArchiveTransaction(tx.id);
          close();
        }}
        className="w-full mt-4 py-3.5 rounded-full bg-neutral-100 font-bold text-sm flex items-center justify-center gap-2"
      >
        {tx.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
        {tx.isArchived ? "Remettre dans l'historique" : "Masquer de l'historique"}
      </button>
    </Sheet>
  );
};
