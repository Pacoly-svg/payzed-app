import React, { useState } from 'react';
import { Archive, ArchiveRestore, Check, Copy, CreditCard } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency, formatTransactionDate } from '../../utils/formatters';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { ICONS } from '../comptes/RecentTransactions';
import { Button, List, Row } from '../ui';

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
      <div className="flex flex-col items-center text-center pb-6">
        {tx.brandLogo ? (
          <BrandLogo brand={tx.brandLogo} size={64} className="rounded-3xl" />
        ) : (
          <span className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center">
            <Icon className="w-7 h-7" />
          </span>
        )}
        <p className="mt-4 text-[15px] font-semibold">{tx.title}</p>
        <p className={`mt-1 text-[32px] font-extrabold tracking-tight ${tx.amount > 0 ? 'text-emerald-600' : ''}`}>
          {formatCurrency(tx.amount, tx.currency, { showSign: true })}
        </p>
        <p className="text-[13px] text-neutral-500 mt-0.5">{tx.subtitle}</p>
      </div>

      <List>
        {rows
          .filter(([, v]) => Boolean(v))
          .map(([k, v]) => (
            <Row key={k} title={<span className="text-neutral-500 font-medium">{k}</span>} trailing={<span className="text-[15px] font-semibold text-right max-w-[60%] break-words">{v}</span>} />
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

      <Button
        variant="secondary"
        className="w-full mt-5"
        icon={tx.isArchived ? <ArchiveRestore className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
        onClick={() => {
          toggleArchiveTransaction(tx.id);
          showToast(tx.isArchived ? "Remise dans l'historique" : "Masquée de l'historique");
          close();
        }}
      >
        {tx.isArchived ? "Remettre dans l'historique" : "Masquer de l'historique"}
      </Button>
    </Sheet>
  );
};
