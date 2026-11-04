import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Lock, 
  Radio, 
  RefreshCw
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { maskCardNumber } from '../../utils/formatters';

export const VirtualCard: React.FC = () => {
  const { card, showToast } = useBanking();
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cvvTimer, setCvvTimer] = useState(30);

  useEffect(() => {
    if (!showDetails) return;
    const interval = setInterval(() => {
      setCvvTimer((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [showDetails]);

  const handleCopyCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(card.fullNumber.replace(/\s+/g, ''));
    setCopied(true);
    showToast('Numéro de carte copié');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Conteneur Physique Carte Black Mate Brossée */}
      <div className="relative w-full aspect-[1.586/1] rounded-3xl p-6 overflow-hidden shadow-[0_20px_45px_rgba(0,0,0,0.9)] border border-neutral-800 card-black-matte transition-all duration-300">
        
        {/* Fond noir profond sobre */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-neutral-950 to-neutral-900 opacity-95 pointer-events-none" />

        {/* Overlay Carte Gelée si card.isFrozen */}
        {card.isFrozen && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center border-2 border-neutral-700 rounded-3xl animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white mb-2 shadow-lg">
              <Lock className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-white">
              Carte Verrouillée
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5">
              Sécurité Payzed Active
            </span>
          </div>
        )}

        {/* Contenu de la Carte */}
        <div className="relative z-10 h-full flex flex-col justify-between text-white">
          
          {/* Ligne Supérieure : Logo Payzed Blanc + Sans Contact */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <img 
                src="/assets/logo/logo-principal-blanc.svg" 
                alt="Payzed" 
                className="h-6 w-auto object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = '/assets/logo/symbole-blanc.svg';
                }}
              />
              <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 uppercase font-semibold">
                {card.cardLevel}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Radio className="w-5 h-5 text-neutral-400 rotate-90 stroke-[1.8]" />
            </div>
          </div>

          {/* Ligne Centrale : Puce EMV Argentée + Numéro Masqué */}
          <div className="my-auto space-y-3">
            {/* Puce EMV Argentée Discrète */}
            <div className="w-10 h-7 rounded bg-gradient-to-br from-neutral-200 via-neutral-400 to-neutral-500 p-0.5 shadow-md flex items-center justify-between relative overflow-hidden border border-neutral-400">
              <div className="w-full h-full border border-neutral-600/30 rounded flex items-center justify-center">
                <div className="w-full h-[1px] bg-neutral-700/40" />
                <div className="h-full w-[1px] bg-neutral-700/40 absolute left-1/3" />
                <div className="h-full w-[1px] bg-neutral-700/40 absolute right-1/3" />
              </div>
            </div>

            {/* Numéro de la Carte */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg sm:text-xl tracking-wider text-white font-bold select-none">
                {maskCardNumber(card.fullNumber, showDetails)}
              </span>

              <button
                onClick={handleCopyCard}
                className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-all active:scale-90"
                title="Copier le numéro"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Ligne Inférieure : Titulaire, Expiration, CVV Dynamique */}
          <div className="flex items-end justify-between pt-2 border-t border-neutral-800/80">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold block">
                Titulaire
              </span>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white truncate max-w-[170px] block">
                {card.cardholderName}
              </span>
            </div>

            <div>
              <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold block">
                Expire
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-neutral-200">
                {card.expiryMonth}/{card.expiryYear}
              </span>
            </div>

            <div>
              <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold block">
                CVV Dynamique
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-white">
                {showDetails ? card.cvv : '•••'}
              </span>
            </div>

            {/* Visa Logo */}
            <div className="flex items-center">
              <span className="text-sm font-extrabold italic tracking-tighter text-white font-sans">
                VISA
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Barre d'Actions de la Carte Haute Couture */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          {/* Bouton 1 : Afficher / Masquer */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 active:scale-95 shadow-2xs ${
              showDetails
                ? 'bg-black text-white border-black'
                : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-200/90 text-neutral-900'
            }`}
          >
            {showDetails ? (
              <>
                <EyeOff className="w-4 h-4 text-white shrink-0" />
                <span className="truncate">Masquer infos</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-black shrink-0" />
                <span className="truncate">Afficher la carte</span>
              </>
            )}
          </button>

          {/* Bouton 2 : Copier le numéro */}
          <button
            onClick={handleCopyCard}
            className="py-2.5 px-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/90 text-neutral-900 text-xs font-bold transition-all flex items-center justify-center space-x-2 active:scale-95 shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-black shrink-0" />
                <span className="truncate text-black">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-neutral-700 shrink-0" />
                <span className="truncate">Copier numéro</span>
              </>
            )}
          </button>
        </div>

        {/* Témoin de Sécurité CVV Dynamique quand révélé */}
        {showDetails && (
          <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-neutral-700 font-medium">
              <RefreshCw className="w-3.5 h-3.5 text-black animate-spin" />
              <span>CVV dynamique sécurisé : <strong className="font-mono text-black font-extrabold">{card.cvv}</strong></span>
            </div>
            <span className="text-[10px] font-mono font-bold text-neutral-400">
              Expire dans {cvvTimer}s
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
