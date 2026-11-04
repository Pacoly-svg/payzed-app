import React, { useState, useRef } from 'react';
import { 
  Coffee, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShoppingBag, 
  Tv, 
  Home, 
  TrendingUp, 
  CreditCard, 
  Filter, 
  ChevronRight, 
  Smartphone,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency, formatTransactionDate } from '../../utils/formatters';
import { BrandLogo } from '../common/BrandLogo';
import { haptic } from '../../utils/haptics';
import type { Transaction, CurrencyCode } from '../../types/banking';

const ICON_MAP: Record<string, React.ElementType> = {
  Coffee,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingBag,
  Tv,
  Home,
  TrendingUp,
  CreditCard,
  Smartphone,
};

interface SwipeableTransactionRowProps {
  tx: Transaction;
  currency: CurrencyCode;
  onSelect: (tx: Transaction) => void;
  onArchiveToggle: (id: string) => void;
}

const SwipeableTransactionRow: React.FC<SwipeableTransactionRowProps> = ({
  tx,
  currency,
  onSelect,
  onArchiveToggle,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    currentXRef.current = e.touches[0].clientX;
    const diff = currentXRef.current - startXRef.current;
    if (diff < 0) {
      // Swipe vers la gauche (révélation de l'action)
      setOffsetX(Math.max(-88, diff));
    } else {
      setOffsetX(0);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (offsetX < -50) {
      haptic.selection();
      onArchiveToggle(tx.id);
      setOffsetX(0);
    } else {
      setOffsetX(0);
    }
  };

  const Icon = ICON_MAP[tx.icon] || CreditCard;
  const isPositive = tx.amount > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl select-none group/swipe">
      {/* Action en arrière-plan révélée au swipe gauche */}
      <div 
        onClick={() => onArchiveToggle(tx.id)}
        className="absolute inset-y-0 right-0 w-24 bg-neutral-900 text-white flex flex-col items-center justify-center cursor-pointer transition-colors active:bg-black rounded-r-2xl"
      >
        {tx.isArchived ? (
          <>
            <ArchiveRestore className="w-4 h-4 mb-0.5 text-white stroke-[2.2]" />
            <span className="text-[10px] font-bold font-mono">Restaurer</span>
          </>
        ) : (
          <>
            <Archive className="w-4 h-4 mb-0.5 text-neutral-300 stroke-[2.2]" />
            <span className="text-[10px] font-bold font-mono">Archiver</span>
          </>
        )}
      </div>

      {/* Carte au premier plan avec translation fluide */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (Math.abs(offsetX) < 6) onSelect(tx);
        }}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative z-10 flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-white hover:bg-neutral-50 border border-neutral-200/80 hover:border-neutral-300 transition-colors duration-150 cursor-pointer shadow-xs active:scale-[0.99] gap-2"
      >
        {/* Gauche : Icône marchand épurée ou BrandLogo & Libellés */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
          {tx.brandLogo ? (
            <BrandLogo brand={tx.brandLogo} size={40} className="rounded-xl shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-900 group-hover/swipe:bg-black group-hover/swipe:text-white transition-colors">
              <Icon className="w-5 h-5 stroke-[2]" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-black group-hover/swipe:text-neutral-700 transition-colors truncate">
              {tx.title}
            </h3>
            <div className="flex items-center space-x-1 sm:space-x-1.5 mt-0.5">
              {tx.isArchived && (
                <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md bg-neutral-200 text-neutral-800 font-bold shrink-0">
                  <Archive className="w-2.5 h-2.5" />
                  <span>Archivée</span>
                </span>
              )}
              <span className="text-[11px] sm:text-xs text-neutral-500 font-medium truncate">
                {tx.subtitle}
              </span>
              <span className="text-[9px] text-neutral-300 shrink-0">•</span>
              <span className="text-[10px] sm:text-[11px] text-neutral-400 shrink-0 font-medium hidden xs:inline">
                {tx.category}
              </span>
            </div>
          </div>
        </div>

        {/* Droite : Montant net & Chevron */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <div className="text-right">
            <p className={`text-xs sm:text-sm font-black font-sans tracking-tight whitespace-nowrap ${
              isPositive ? 'text-black' : 'text-neutral-950'
            }`}>
              {formatCurrency(tx.amount, currency, { showSign: true })}
            </p>
            <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium block">
              {formatTransactionDate(tx.timestamp)}
            </span>
          </div>

          <div className="p-0.5 sm:p-1 rounded-full text-neutral-400 group-hover/swipe:text-black group-hover/swipe:translate-x-0.5 transition-all">
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const RecentTransactions: React.FC = () => {
  const { transactions, currency, setSelectedTransaction, toggleArchiveTransaction } = useBanking();
  const [filter, setFilter] = useState<'all' | 'in' | 'out' | 'archived'>('all');
  const [showAll, setShowAll] = useState(false);

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'archived') {
      return Boolean(tx.isArchived);
    }
    // Pour Toutes, Entrées et Sorties, on masque les transactions archivées
    if (tx.isArchived) return false;
    if (filter === 'in' && tx.amount <= 0) return false;
    if (filter === 'out' && tx.amount >= 0) return false;
    return true;
  });

  const displayedTransactions = showAll ? filteredTransactions : filteredTransactions.slice(0, 4);

  return (
    <div className="space-y-3.5">
      {/* En-tête et Filtres Segmentés (Zéro scrollbar, zéro coupure) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-black tracking-tight">
            Transactions récentes
          </h2>
          {filteredTransactions.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-bold text-neutral-500 hover:text-black transition-colors"
            >
              {showAll ? 'Réduire' : 'Voir tout'}
            </button>
          )}
        </div>

        {/* Filtres Monochrome Segmentés Full-Width */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-neutral-100 border border-neutral-200/90">
          <button
            onClick={() => {
              haptic.selection();
              setFilter('all');
            }}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold text-center transition-all ${
              filter === 'all' 
                ? 'bg-black text-white shadow-xs' 
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => {
              haptic.selection();
              setFilter('in');
            }}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold text-center transition-all ${
              filter === 'in' 
                ? 'bg-black text-white shadow-xs' 
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            Entrées
          </button>
          <button
            onClick={() => {
              haptic.selection();
              setFilter('out');
            }}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold text-center transition-all ${
              filter === 'out' 
                ? 'bg-black text-white shadow-xs' 
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            Sorties
          </button>
          <button
            onClick={() => {
              haptic.selection();
              setFilter('archived');
            }}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold text-center transition-all ${
              filter === 'archived' 
                ? 'bg-black text-white shadow-xs' 
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            Archivées
          </button>
        </div>
      </div>

      {/* Liste des Transactions */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-neutral-50 border border-neutral-200">
            <Filter className="w-8 h-8 mx-auto text-neutral-400 stroke-[1.5] mb-2" />
            <p className="text-xs text-neutral-500 font-medium">Aucune transaction pour ce filtre</p>
          </div>
        ) : (
          displayedTransactions.map((tx) => (
            <SwipeableTransactionRow
              key={tx.id}
              tx={tx}
              currency={currency}
              onSelect={setSelectedTransaction}
              onArchiveToggle={toggleArchiveTransaction}
            />
          ))
        )}

        {filteredTransactions.length > 4 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-700 flex items-center justify-center space-x-1.5 transition-all active:scale-[0.98] mt-2"
          >
            <span>{showAll ? 'Réduire la liste' : `Voir les ${filteredTransactions.length} transactions`}</span>
          </button>
        )}
      </div>
    </div>
  );
};
