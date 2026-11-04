import React from 'react';
import { 
  Lock, 
  Unlock, 
  Globe, 
  Radio, 
  ShieldCheck, 
  PlusCircle
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';

export const CardSecurityControls: React.FC = () => {
  const { 
    card, 
    toggleFreezeCard, 
    toggleOnlinePayments, 
    toggleContactless,
    setActiveModal 
  } = useBanking();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Contrôles de Sécurité
        </h2>
        <span className="text-[11px] font-medium text-neutral-600 flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-black" />
          <span>Protection 3D-Secure active</span>
        </span>
      </div>

      <div className="space-y-2.5">
        {/* Contrôle 1 : Verrouiller la carte */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-neutral-200/90 hover:border-neutral-300 transition-all shadow-xs">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              card.isFrozen 
                ? 'bg-black text-white' 
                : 'bg-neutral-100 text-black border border-neutral-200'
            }`}>
              {card.isFrozen ? <Lock className="w-5 h-5 stroke-[2]" /> : <Unlock className="w-5 h-5 stroke-[2]" />}
            </div>
            <div>
              <p className="text-xs font-bold text-black">
                {card.isFrozen ? 'Carte Verrouillée' : 'Verrouiller la carte'}
              </p>
              <p className="text-[10px] text-neutral-500 font-medium">
                {card.isFrozen ? 'Tous les débits et paiements sont temporairement suspendus' : 'Bloquez instantanément tout débit en 1 clic'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleFreezeCard}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              card.isFrozen 
                ? 'bg-black text-white hover:bg-neutral-800 shadow-sm' 
                : 'bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-200'
            }`}
          >
            {card.isFrozen ? 'Déverrouiller' : 'Verrouiller'}
          </button>
        </div>

        {/* Contrôle 2 : Paiements en ligne */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-neutral-200/90 hover:border-neutral-300 transition-all shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black">
              <Globe className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-xs font-bold text-black">Paiements en ligne</p>
              <p className="text-[10px] text-neutral-500 font-medium">E-commerce, abonnements et règlements web</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={card.onlinePaymentsEnabled} 
              onChange={toggleOnlinePayments} 
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black after:shadow-xs"></div>
          </label>
        </div>

        {/* Contrôle 3 : Sans-contact NFC */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-neutral-200/90 hover:border-neutral-300 transition-all shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black">
              <Radio className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-xs font-bold text-black">Sans-contact (NFC)</p>
              <p className="text-[10px] text-neutral-500 font-medium">Paiement sur terminal physique en magasin</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={card.contactlessEnabled} 
              onChange={toggleContactless} 
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black after:shadow-xs"></div>
          </label>
        </div>

        {/* Bouton Créer une Nouvelle Carte Virtuelle */}
        <button
          onClick={() => setActiveModal('newCard')}
          className="w-full p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-dashed border-neutral-300 hover:border-black text-neutral-800 hover:text-black flex items-center justify-center space-x-2 text-xs font-semibold transition-all active:scale-[0.99] shadow-xs"
        >
          <PlusCircle className="w-4 h-4 text-black" />
          <span>Créer une carte virtuelle éphémère</span>
        </button>
      </div>
    </div>
  );
};
