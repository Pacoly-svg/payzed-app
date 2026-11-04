import React from 'react';
import { VirtualCard } from './VirtualCard';
import { CardSecurityControls } from './CardSecurityControls';
import { SpendingLimitSlider } from './SpendingLimitSlider';
import { ShieldCheck, Zap, Globe, CreditCard } from 'lucide-react';

export const CardsScreen: React.FC = () => {
  return (
    <div className="space-y-4 pb-24 bg-white text-black">
      {/* En-tête de l'onglet Cartes */}
      <div className="px-1">
        <h1 className="text-xl font-extrabold text-black tracking-tight">
          Carte Virtuelle Payzed Black
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Espace sécurisé • Paramètres confidentiels & contrôles
        </p>
      </div>

      {/* Carte Physique Black Mate */}
      <VirtualCard />

      {/* Curseur de Plafond */}
      <SpendingLimitSlider />

      {/* Interrupteurs de Sécurité */}
      <CardSecurityControls />

      {/* Garanties & Services Payzed Black */}
      <div className="p-4 rounded-3xl bg-neutral-50 border border-neutral-200/80 space-y-3">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-4 h-4 text-black" />
          <h3 className="text-xs font-bold text-black uppercase tracking-wider font-mono">
            Garanties Incluses • Visa Infinite
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-800">
          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-white border border-neutral-200/80 shadow-xs">
            <Globe className="w-3.5 h-3.5 text-black shrink-0" />
            <span className="font-semibold truncate">0% frais de change</span>
          </div>
          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-white border border-neutral-200/80 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-black shrink-0" />
            <span className="font-semibold truncate">Assurance voyage</span>
          </div>
          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-white border border-neutral-200/80 shadow-xs">
            <Zap className="w-3.5 h-3.5 text-black shrink-0" />
            <span className="font-semibold truncate">Plafonds modulables</span>
          </div>
          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-white border border-neutral-200/80 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-black shrink-0" />
            <span className="font-semibold truncate">Protection 3D-Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};
