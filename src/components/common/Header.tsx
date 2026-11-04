import React from 'react';
import { ScanLine } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { PayzedLogo } from './PayzedLogo';

export const Header: React.FC = () => {
  const { user, setActiveTab, setActiveModal } = useBanking();
  const initials = user.name.trim().split(/\s+/).map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase();

  return (
    <header className="shrink-0 bg-white border-b border-neutral-100 app-safe-top">
      <div className="h-14 px-5 flex items-center justify-between">
        <PayzedLogo className="text-black" size="md" />
        <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveModal('scan')}
          aria-label="Scanner un QR code pour payer"
          className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ScanLine className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('parametres')}
          aria-label="Mon profil"
          className="w-10 h-10 rounded-full overflow-hidden bg-black text-white flex items-center justify-center font-bold text-sm active:scale-95 transition-transform"
        >
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
        </button>
        </div>
      </div>
    </header>
  );
};
