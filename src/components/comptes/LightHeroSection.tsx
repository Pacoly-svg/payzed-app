import React from 'react';
import { 
  Eye, 
  EyeOff, 
  Plus, 
  ArrowUpRight, 
  UserPlus
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';

interface QuickRecipient {
  id: string;
  name: string;
  initials: string;
  tag: string;
  recentAmount?: number;
}

const FAVORITE_RECIPIENTS: QuickRecipient[] = [
  { id: '1', name: 'Fatou Sow', initials: 'FS', tag: '@fatou.s', recentAmount: 75000 },
  { id: '2', name: 'Cheikh Ndiaye', initials: 'CN', tag: '@cheikh.n', recentAmount: 350000 },
  { id: '3', name: 'Aminata Fall', initials: 'AF', tag: '@aminata.f', recentAmount: 120000 },
  { id: '4', name: 'Ousmane Ba', initials: 'OB', tag: '@ousmane.b', recentAmount: 50000 },
  { id: '5', name: 'Aïssatou Diallo', initials: 'AD', tag: '@aissatou.d', recentAmount: 25000 },
];

export const LightHeroSection: React.FC = () => {
  const { 
    balance, 
    currency, 
    isBalanceHidden, 
    toggleHideBalance, 
    setActiveModal,
  } = useBanking();

  const handleQuickSend = (_recipient: QuickRecipient) => {
    setActiveModal('transfer');
  };

  return (
    <section className="pt-2 pb-4 px-5 bg-white text-black border-b border-neutral-100">
      {/* 1. Solde Principal Haute Définition */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
            Solde disponible
          </span>
          <button
            onClick={toggleHideBalance}
            className="text-xs text-neutral-500 hover:text-black flex items-center space-x-1.5 transition-colors py-1 px-2.5 rounded-xl hover:bg-neutral-100 bg-neutral-50 border border-neutral-200/60"
          >
            {isBalanceHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="font-semibold">{isBalanceHidden ? 'Afficher' : 'Masquer'}</span>
          </button>
        </div>

        <div className="flex items-baseline space-x-3 py-1 overflow-hidden">
          {isBalanceHidden ? (
            <span className="text-3xl sm:text-4xl font-bold font-mono tracking-widest text-neutral-400">
              ••••••••
            </span>
          ) : (
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black font-sans leading-none truncate max-w-full">
              {formatCurrency(balance, currency)}
            </h1>
          )}
        </div>

        {/* Compte Principal Référence Bancaire */}
        <div className="flex items-center space-x-2 pt-0.5">
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200/80 text-neutral-700 text-[10px] font-bold font-mono">
            <span>SN08 •••• 2011</span>
          </span>
          <span className="text-[11px] text-neutral-400 font-medium">
            Compte Courant Particulier
          </span>
        </div>
      </div>

      {/* 3. Boutons d'Action Principaux en Noir & Blanc */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* + Recharger (Noir élégant tactile) */}
        <button
          onClick={() => setActiveModal('topup')}
          className="pill-btn-black py-3.5 px-4 rounded-full font-bold text-xs flex items-center justify-center space-x-2 active:scale-95 transition-all group"
        >
          <div className="w-5 h-5 rounded-full bg-neutral-800 text-white flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="tracking-wide text-white">
            Recharger
          </span>
        </button>

        {/* Transférer (Blanc contrasté avec bordure) */}
        <button
          onClick={() => setActiveModal('transfer')}
          className="pill-btn-white py-3.5 px-4 rounded-full font-bold text-xs flex items-center justify-center space-x-2 active:scale-95 transition-all group"
        >
          <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="tracking-wide text-black">
            Transférer
          </span>
        </button>
      </div>

      {/* 4. Envoi Rapide aux Contacts (Initiales / Monogrammes au lieu de fausses photos) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-black tracking-tight">
            Bénéficiaires récents
          </span>
        </div>

        <div className="flex items-center space-x-3 overflow-x-auto py-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Bouton Ajouter Bénéficiaire */}
          <button
            onClick={() => setActiveModal('transfer')}
            className="flex flex-col items-center space-y-1 shrink-0 group active:scale-95"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-neutral-300 hover:border-black flex items-center justify-center text-neutral-500 hover:text-black transition-colors bg-white">
              <UserPlus className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="text-[10px] font-semibold text-neutral-600 group-hover:text-black">
              Ajouter
            </span>
          </button>

          {/* Favoris avec Monogrammes Intelligents */}
          {FAVORITE_RECIPIENTS.map((rec) => (
            <button
              key={rec.id}
              onClick={() => handleQuickSend(rec)}
              className="flex flex-col items-center space-y-1 shrink-0 group active:scale-95"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 group-hover:border-black flex items-center justify-center font-bold text-xs font-mono text-black transition-all">
                {rec.initials}
              </div>
              <span className="text-[10px] font-semibold text-neutral-800 group-hover:text-black truncate max-w-[64px]">
                {rec.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
