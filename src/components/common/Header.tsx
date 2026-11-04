import React from 'react';
import { ScanLine, Settings } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { PayzedLogo } from './PayzedLogo';

const iconButton = 'w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center active:scale-95 transition-transform';

/** En-tête : réglages (engrenage) · logo · scanner. */
export const Header: React.FC = () => {
  const { setActiveModal } = useBanking();
  return (
    <header className="shrink-0 bg-white border-b border-neutral-100 app-safe-top">
      <div className="h-14 px-5 grid grid-cols-[40px_1fr_40px] items-center">
        <button type="button" onClick={() => setActiveModal('settings')} aria-label="Réglages" className={iconButton}>
          <Settings className="w-5 h-5" />
        </button>
        <PayzedLogo className="text-black justify-self-center" size="md" />
        <button type="button" onClick={() => setActiveModal('scan')} aria-label="Scanner un QR code pour payer" className={iconButton}>
          <ScanLine className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
