import React from 'react';
import { ScanLine } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { PayzedLogo } from './PayzedLogo';

/** En-tête : logo + scanner (le profil est accessible depuis la barre du bas). */
export const Header: React.FC = () => {
  const { setActiveModal } = useBanking();
  return (
    <header className="shrink-0 bg-white border-b border-neutral-100 app-safe-top">
      <div className="h-14 px-5 flex items-center justify-between">
        <PayzedLogo className="text-black" size="md" />
        <button
          type="button"
          onClick={() => setActiveModal('scan')}
          aria-label="Scanner un QR code pour payer"
          className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ScanLine className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
