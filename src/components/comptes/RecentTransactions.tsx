import React, { useState } from 'react';
import {
  ArrowDownLeft,
  Banknote,
  ArrowUpRight,
  Coffee,
  CreditCard,
  Droplets,
  Home,
  Shield,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Tv,
  Zap,
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency, formatTransactionDate } from '../../utils/formatters';
import { BrandLogo } from '../common/BrandLogo';
import type { Transaction } from '../../types/banking';
import { SectionTitle } from '../ui';
import { STATUS_LABEL, STATUS_STYLE } from '../../utils/status';

export const ICONS: Record<string, React.ElementType> = {
  ArrowDownLeft,
  Banknote,
  ArrowUpRight,
  Coffee,
  CreditCard,
  Droplets,
  Home,
  Shield,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Tv,
  Zap,
};

type Filter = 'all' | 'in' | 'out' | 'archived';
const PAGE = 6;

const Row: React.FC<{ tx: Transaction; onSelect: (tx: Transaction) => void }> = ({ tx, onSelect }) => {
  const Icon = ICONS[tx.icon] ?? CreditCard;
  return (
    <button
      type="button"
      onClick={() => onSelect(tx)}
      className="w-full flex items-center gap-3 py-3 text-left active:bg-neutral-50 rounded-xl"
    >
      {tx.brandLogo ? (
        <BrandLogo brand={tx.brandLogo} size={44} className="rounded-2xl shrink-0" />
      ) : (
        <span className="w-11 h-11 rounded-2xl bg-neutral-100 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold truncate">{tx.title}</span>
        <span className="flex items-center gap-1.5 mt-0.5 min-w-0">
          {tx.status !== 'completed' && (
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${STATUS_STYLE[tx.status]}`}>{STATUS_LABEL[tx.status]}</span>
          )}
          <span className="text-[13px] text-neutral-500 truncate">{formatTransactionDate(tx.timestamp)}</span>
        </span>
      </span>
      <span
        className={`text-[15px] font-bold whitespace-nowrap ${
          tx.status === 'failed' || tx.status === 'cancelled' ? 'text-neutral-400 line-through' : tx.amount > 0 && tx.status === 'completed' ? 'text-emerald-600' : 'text-black'
        }`}
      >
        {formatCurrency(tx.amount, tx.currency, { showSign: true })}
      </span>
    </button>
  );
};

export const RecentTransactions: React.FC = () => {
  const { transactions, setSelectedTransaction } = useBanking();
  const [filter, setFilter] = useState<Filter>('all');
  const [limit, setLimit] = useState(PAGE);

  const hasArchived = transactions.some((t) => t.isArchived);
  const list = transactions.filter((tx) => {
    if (filter === 'archived') return Boolean(tx.isArchived);
    if (tx.isArchived) return false;
    if (filter === 'in') return tx.amount > 0;
    if (filter === 'out') return tx.amount < 0;
    return true;
  });

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Tout' },
    { id: 'in', label: 'Reçus' },
    { id: 'out', label: 'Envoyés' },
    ...(hasArchived ? [{ id: 'archived' as Filter, label: 'Archivés' }] : []),
  ];

  return (
    <section className="space-y-2">
      <SectionTitle>Historique</SectionTitle>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 py-1">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setFilter(f.id);
              setLimit(PAGE);
            }}
            className={`h-9 px-4 rounded-full text-sm font-bold shrink-0 transition-colors ${
              filter === f.id ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-500">Aucune opération</p>
      ) : (
        <div className="divide-y divide-neutral-100">
          {list.slice(0, limit).map((tx) => (
            <Row key={tx.id} tx={tx} onSelect={setSelectedTransaction} />
          ))}
        </div>
      )}

      {list.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE * 2)}
          className="w-full h-11 rounded-full bg-neutral-100 text-sm font-bold active:scale-[0.98] transition-transform"
        >
          Voir plus
        </button>
      )}
    </section>
  );
};
