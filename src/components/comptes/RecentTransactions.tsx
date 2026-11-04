/* eslint-disable react-refresh/only-export-components */
import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Check,
  Coffee,
  CreditCard,
  Droplets,
  Eye,
  EyeOff,
  Home,
  Landmark,
  Shield,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Tv,
  Zap,
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency, formatTransactionDate } from '../../utils/formatters';
import { operationLabel } from '../../utils/messages';
import { isVisibleInHistory } from '../../utils/status';
import { useBackHandler } from '../../utils/backStack';
import { BrandLogo } from '../common/BrandLogo';
import type { Transaction } from '../../types/banking';
import { Button, SectionTitle } from '../ui';

export const ICONS: Record<string, React.ElementType> = {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Coffee,
  CreditCard,
  Droplets,
  Home,
  Landmark,
  Shield,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Tv,
  Zap,
};

type Filter = 'all' | 'in' | 'out' | 'hidden';
const PAGE = 8;

/** Montant affiché : noir pour tout, rouge barré uniquement pour un échec. */
const Amount: React.FC<{ tx: Transaction }> = ({ tx }) => (
  <span className={`text-[15px] font-bold whitespace-nowrap tabular-nums ${tx.status === 'failed' ? 'text-red-600 line-through decoration-2' : 'text-black'}`}>
    {formatCurrency(tx.amount, tx.currency, { showSign: true })}
  </span>
);

const Row: React.FC<{ tx: Transaction; onSelect: () => void; selecting: boolean; selected: boolean }> = ({ tx, onSelect, selecting, selected }) => {
  const Icon = ICONS[tx.icon] ?? CreditCard;
  return (
    <button type="button" onClick={onSelect} className="w-full flex items-center gap-3 py-3 text-left active:bg-neutral-50 rounded-xl">
      {selecting && (
        <span
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            selected ? 'bg-black border-black text-white' : 'border-neutral-300'
          }`}
          aria-hidden
        >
          {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
        </span>
      )}
      {tx.brandLogo ? (
        <BrandLogo brand={tx.brandLogo} size={44} />
      ) : (
        <span className="w-11 h-11 rounded-2xl bg-neutral-100 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold truncate">{tx.title}</span>
        <span className="flex items-center gap-1.5 mt-0.5 min-w-0">
          {tx.status === 'failed' && <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md shrink-0 bg-red-50 text-red-600">Échoué</span>}
          <span className="text-[13px] text-neutral-500 truncate">
            {operationLabel(tx)} · {formatTransactionDate(tx.timestamp)}
          </span>
        </span>
      </span>
      <Amount tx={tx} />
    </button>
  );
};

export const RecentTransactions: React.FC = () => {
  const { transactions, setSelectedTransaction, isHistoryHidden, toggleHistoryHidden, setArchived, showToast } = useBanking();
  const [filter, setFilter] = useState<Filter>('all');
  const [limit, setLimit] = useState(PAGE);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Retour Android : quitter d'abord le mode sélection
  useBackHandler(() => {
    setSelecting(false);
    setSelected(new Set());
  }, selecting);

  // Historique : opérations arrivées uniquement (les programmées n'existent qu'à leur arrivée), plus récentes d'abord
  const visible = useMemo(() => transactions.filter(isVisibleInHistory).sort((a, b) => b.timestamp - a.timestamp), [transactions]);
  const hiddenCount = visible.filter((t) => t.isArchived).length;
  const list = visible.filter((tx) => {
    if (filter === 'hidden') return Boolean(tx.isArchived);
    if (tx.isArchived) return false;
    if (filter === 'in') return tx.amount > 0;
    if (filter === 'out') return tx.amount < 0;
    return true;
  });

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Tout' },
    { id: 'in', label: 'Reçus' },
    { id: 'out', label: 'Dépensés' },
    ...(hiddenCount ? [{ id: 'hidden' as Filter, label: `Masqués (${hiddenCount})` }] : []),
  ];

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const applySelection = () => {
    const ids = [...selected];
    const showing = filter === 'hidden';
    setArchived(ids, !showing);
    showToast(showing ? `${ids.length} opération${ids.length > 1 ? 's' : ''} réaffichée${ids.length > 1 ? 's' : ''}` : `${ids.length} opération${ids.length > 1 ? 's' : ''} masquée${ids.length > 1 ? 's' : ''}`);
    setSelecting(false);
    setSelected(new Set());
  };

  return (
    <section className="space-y-2">
      <SectionTitle
        action={
          <div className="flex items-center gap-2">
            {!isHistoryHidden && list.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelecting((v) => !v);
                  setSelected(new Set());
                }}
                className="h-9 px-3.5 rounded-full text-[13px] font-bold bg-neutral-100 active:bg-neutral-200"
              >
                {selecting ? 'Terminer' : 'Choisir'}
              </button>
            )}
            <button
              type="button"
              onClick={toggleHistoryHidden}
              aria-pressed={isHistoryHidden}
              aria-label={isHistoryHidden ? "Afficher l'historique" : "Masquer l'historique"}
              className={`h-9 pl-3 pr-3.5 rounded-full flex items-center gap-1.5 text-[13px] font-bold transition-colors ${
                isHistoryHidden ? 'bg-black text-white' : 'bg-neutral-100 active:bg-neutral-200'
              }`}
            >
              {isHistoryHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {isHistoryHidden ? 'Afficher' : 'Masquer'}
            </button>
          </div>
        }
      >
        Historique
      </SectionTitle>

      {isHistoryHidden ? (
        <button
          type="button"
          onClick={toggleHistoryHidden}
          className="w-full mt-2 rounded-3xl bg-neutral-100 px-5 py-8 flex flex-col items-center gap-2 text-center active:bg-neutral-200 transition-colors"
        >
          <span className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center">
            <EyeOff className="w-5 h-5" />
          </span>
          <span className="text-[15px] font-bold">Historique masqué</span>
          <span className="text-[13px] text-neutral-500">Touchez pour l'afficher</span>
        </button>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 py-1">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilter(f.id);
                  setLimit(PAGE);
                  setSelected(new Set());
                }}
                className={`h-9 px-4 rounded-full text-sm font-bold shrink-0 transition-colors ${
                  filter === f.id ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {selecting && (
            <p className="text-[13px] text-neutral-500 px-1">
              {filter === 'hidden' ? 'Choisissez les opérations à réafficher.' : "Choisissez les opérations à masquer de l'historique."}
            </p>
          )}

          {list.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-500">Aucune opération</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {list.slice(0, limit).map((tx) => (
                <Row
                  key={tx.id}
                  tx={tx}
                  selecting={selecting}
                  selected={selected.has(tx.id)}
                  onSelect={() => (selecting ? toggle(tx.id) : setSelectedTransaction(tx))}
                />
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

          {selecting && (
            <div className="sticky bottom-2 pt-2">
              <Button className="w-full shadow-lg" disabled={selected.size === 0} onClick={applySelection}>
                {filter === 'hidden' ? `Réafficher (${selected.size})` : `Masquer (${selected.size})`}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
};
