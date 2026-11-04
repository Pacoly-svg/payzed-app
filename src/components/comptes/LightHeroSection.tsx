import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';

export const LightHeroSection: React.FC = () => {
  const { balance, currency, isBalanceHidden, toggleHideBalance, setActiveModal } = useBanking();

  return (
    <section className="rounded-[28px] bg-black text-white p-5 space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400 font-medium">Solde disponible</span>
          <button
            type="button"
            onClick={toggleHideBalance}
            aria-label={isBalanceHidden ? 'Afficher le solde' : 'Masquer le solde'}
            className="p-2 -mr-2 rounded-full text-neutral-400 active:bg-white/10"
          >
            {isBalanceHidden ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[clamp(1.75rem,9vw,2.5rem)] font-extrabold tracking-tight leading-tight break-words">
          {isBalanceHidden ? '••••••' : formatCurrency(balance, currency)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setActiveModal('transfer')}
          className="py-3.5 rounded-full bg-white text-black font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
        >
          <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} /> Envoyer
        </button>
        <button
          type="button"
          onClick={() => setActiveModal('qr')}
          className="py-3.5 rounded-full bg-white/15 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
        >
          <ArrowDownLeft className="w-4 h-4" strokeWidth={2.5} /> Recevoir
        </button>
      </div>
    </section>
  );
};
