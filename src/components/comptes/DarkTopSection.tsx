import React from 'react';
import { 
  Eye, 
  EyeOff, 
  Plus, 
  ArrowUpRight, 
  QrCode, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';

export const DarkTopSection: React.FC = () => {
  const { 
    user, 
    balance, 
    currency, 
    isBalanceHidden, 
    toggleHideBalance, 
    setActiveModal,
    setIsOnboardingOpen 
  } = useBanking();

  return (
    <section className="pt-2 pb-7 px-5 bg-black text-white">
      {/* 1. Profil Utilisateur */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="w-10 h-10 rounded-full object-cover border border-neutral-700 shadow-sm"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-white border-2 border-black" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-bold text-white tracking-tight">
                {user.name}
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <p className="text-[11px] text-neutral-400 font-medium">
              {user.tag} • <span className="text-neutral-200">{user.tier}</span>
            </p>
          </div>
        </div>

        {/* Bouton Guide / Présentation */}
        <button
          onClick={() => setIsOnboardingOpen(true)}
          className="pill-btn-black flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          title="Ouvrir la présentation Payzed"
        >
          <Sparkles className="w-3 h-3 text-neutral-300" />
          <span>Guide</span>
        </button>
      </div>

      {/* 2. Solde Principal */}
      <div className="space-y-1 mb-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
            Solde disponible
          </span>
          <button
            onClick={toggleHideBalance}
            className="text-xs text-neutral-400 hover:text-white flex items-center space-x-1 transition-colors py-0.5 px-1.5 rounded"
          >
            {isBalanceHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isBalanceHidden ? 'Afficher' : 'Masquer'}</span>
          </button>
        </div>

        <div className="flex items-baseline space-x-3">
          {isBalanceHidden ? (
            <span className="text-3xl sm:text-4xl font-bold font-mono tracking-widest text-neutral-400">
              ••••••••
            </span>
          ) : (
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
              {formatCurrency(balance, currency)}
            </h1>
          )}
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px] font-semibold">
            <span>+8,4 % ce mois-ci</span>
          </span>
          <span className="text-[11px] text-neutral-500">
            • Tous comptes synchronisés
          </span>
        </div>
      </div>

      {/* 3. Boutons d'Action Principaux en Noir et Blanc */}
      <div className="grid grid-cols-2 gap-3">
        {/* + Recharger (Noir élégant) */}
        <button
          onClick={() => setActiveModal('topup')}
          className="pill-btn-black py-3.5 px-4 rounded-full font-bold text-xs flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all group"
        >
          <div className="w-5 h-5 rounded-full bg-neutral-800 text-white flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="tracking-wide text-white group-hover:text-neutral-200">
            Recharger
          </span>
        </button>

        {/* Transférer (Blanc contrasté) */}
        <button
          onClick={() => setActiveModal('transfer')}
          className="pill-btn-white py-3.5 px-4 rounded-full font-bold text-xs flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all group"
        >
          <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="tracking-wide text-black group-hover:text-neutral-800">
            Transférer
          </span>
        </button>
      </div>

      {/* Raccourci QR Code Rapide */}
      <div className="mt-3">
        <button
          onClick={() => setActiveModal('qr')}
          className="w-full py-2.5 px-4 rounded-full bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-white flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
        >
          <QrCode className="w-3.5 h-3.5 text-white" />
          <span>Scanner ou payer par QR Code</span>
        </button>
      </div>
    </section>
  );
};
