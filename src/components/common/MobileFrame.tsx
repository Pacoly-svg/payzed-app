import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';

interface MobileFrameProps {
  children: React.ReactNode;
  bottomNav?: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children, bottomNav }) => {
  const { isPhoneMockup } = useBanking();

  if (!isPhoneMockup) {
    return (
      <div className="min-h-[100dvh] bg-neutral-100 text-black flex flex-col items-center">
        <div className="w-full max-w-lg min-h-[100dvh] relative flex flex-col bg-white border-x border-neutral-200 shadow-xl">
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          {bottomNav && (
            <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-40 pointer-events-none">
              {bottomNav}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F0F2F5] flex flex-col items-center justify-center p-0 sm:p-6 lg:p-10">
      {/* Studio ambient aura discret */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-white/60 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-neutral-200/50 rounded-full blur-[140px] pointer-events-none" />

      {/* Châssis Smartphone Haute Précision */}
      <div className="relative w-full sm:w-[412px] min-h-[100dvh] sm:h-[870px] sm:min-h-0 bg-white sm:rounded-[52px] sm:border-[8px] sm:border-neutral-900 shadow-[0_25px_80px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
        
        {/* Dynamic Island / Barre de statut (visible uniquement sur desktop/mockup) */}
        <div className="hidden sm:flex items-center justify-between px-7 pt-3 pb-1 shrink-0 z-40 bg-white border-b border-neutral-100">
          <span className="text-[12px] font-semibold text-neutral-900 tracking-tight font-mono">
            09:41
          </span>

          {/* Dynamic Island Pilule Minimaliste */}
          <div className="w-24 h-5 rounded-full bg-black border border-neutral-800 flex items-center justify-end px-2 space-x-1 shadow-inner">
            <div className="w-2 h-2 rounded-full bg-neutral-700" />
          </div>

          {/* Signal / Wifi / Batterie */}
          <div className="flex items-center space-x-1.5 text-neutral-900">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 fill-current" />
          </div>
        </div>

        {/* Contenu Déroulant (Scrollable Viewport) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col bg-white text-black overscroll-contain">
          {children}
        </div>

        {/* Barre de navigation FIXE au bas du châssis */}
        {bottomNav && (
          <div className="fixed sm:absolute bottom-0 left-0 right-0 z-40 pointer-events-none">
            {bottomNav}
          </div>
        )}

      </div>
    </div>
  );
};
