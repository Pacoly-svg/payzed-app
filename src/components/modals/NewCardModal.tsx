import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  ShieldCheck, 
  Copy, 
  Check 
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { triggerSuccessConfetti } from '../../utils/confetti';

export const NewCardModal: React.FC = () => {
  const { activeModal, setActiveModal, currency, showToast } = useBanking();
  const [created, setCreated] = useState(false);
  const [copied, setCopied] = useState(false);

  if (activeModal !== 'newCard') return null;

  const tempCard = {
    number: '4892 1093 8847 2190',
    expiry: '11/26',
    cvv: '912',
    limit: currency === 'XOF' ? '150000' : '250',
  };

  const handleCreateCard = () => {
    setCreated(true);
    triggerSuccessConfetti();
    showToast('Carte éphémère générée pour 1 transaction');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tempCard.number.replace(/\s+/g, ''));
    setCopied(true);
    showToast('Numéro copié');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-neutral-200 text-black overflow-hidden shadow-2xl">
        
        {/* En-tête Monochrome */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black">
              <CreditCard className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-black">Carte Éphémère Payzed</h2>
              <p className="text-[10px] text-neutral-500 font-medium">Usage unique pour vos achats web sécurisés</p>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveModal(null);
              setCreated(false);
            }}
            className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!created ? (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black mx-auto shadow-xs">
                <ShieldCheck className="w-7 h-7 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-black">Protection Achat Unique</h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed font-medium">
                  Cette carte virtuelle se détruit automatiquement après le premier paiement. Idéale pour sécuriser vos règlements sur internet.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-medium">Plafond automatique :</span>
                  <span className="text-black font-mono font-bold">{tempCard.limit} {currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-medium">Validité :</span>
                  <span className="text-black font-semibold">24 heures ou 1 utilisation</span>
                </div>
              </div>

              <button
                onClick={handleCreateCard}
                className="w-full py-3 rounded-2xl bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99]"
              >
                Générer la carte éphémère
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in zoom-in-95 duration-150">
              {/* Carte Éphémère Noire Mate */}
              <div className="p-4 rounded-2xl bg-black border border-neutral-800 space-y-3 relative overflow-hidden shadow-lg">
                <div className="flex justify-between items-center text-white">
                  <span className="text-[10px] font-mono tracking-widest text-neutral-300 font-bold uppercase">
                    USAGE UNIQUE
                  </span>
                  <span className="text-xs font-bold font-mono">VISA</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-mono text-base font-bold text-white tracking-wider">
                    {tempCard.number}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex justify-between text-xs pt-1 border-t border-neutral-800 text-neutral-300">
                  <div>
                    <span className="text-[9px] text-neutral-500 block">EXPIRE</span>
                    <span className="font-mono">{tempCard.expiry}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-500 block">CVV</span>
                    <span className="font-mono text-white font-bold">{tempCard.cvv}</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-neutral-500 text-center font-medium">
                Numéro actif. Prêt à être collé pour valider votre commande.
              </p>

              <button
                onClick={() => {
                  setActiveModal(null);
                  setCreated(false);
                }}
                className="w-full py-2.5 rounded-2xl bg-black hover:bg-neutral-800 text-white border border-black font-bold text-xs transition-colors shadow-xs"
              >
                Terminé
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
