import React from 'react';
import { Eye, EyeOff, ShieldCheck, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';

export const BalanceCard: React.FC = () => {
  const { 
    balance, 
    currency, 
    isBalanceHidden, 
    toggleHideBalance,
    setActiveModal 
  } = useBanking();

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 glass-panel border border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
      {/* Background ambient neon glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top row: Label & Hide Balance button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Solde disponible
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
            Vérifié
          </span>
        </div>

        <button
          onClick={toggleHideBalance}
          aria-label={isBalanceHidden ? 'Afficher le solde' : 'Masquer le solde'}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.06] transition-all text-xs"
        >
          {isBalanceHidden ? (
            <>
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Afficher</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Masquer</span>
            </>
          )}
        </button>
      </div>

      {/* Balance Amount display */}
      <div className="mt-3.5">
        {isBalanceHidden ? (
          <div className="h-10 flex items-center">
            <span className="text-3xl font-extrabold tracking-widest text-slate-300 font-mono">
              ••••••••••
            </span>
          </div>
        ) : (
          <div className="flex items-baseline space-x-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
              {formatCurrency(balance, currency)}
            </h1>
          </div>
        )}
      </div>

      {/* Account micro-meta & quick deposit / send pills */}
      <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">Compte Principal Garanti</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveModal('qr')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/20 transition-all text-xs active:scale-95"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Recevoir</span>
          </button>
          <button
            onClick={() => setActiveModal('transfer')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-medium border border-white/[0.08] transition-all text-xs active:scale-95"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Envoyer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
