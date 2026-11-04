import React from 'react';
import { useBanking } from '../../context/BankingContext';
import { PayzedLogo } from './PayzedLogo';

export const Header: React.FC = () => {
  const { user, setActiveTab } = useBanking();
  const initials = user.name.trim().split(/\s+/).map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase();

  return (
    <header className="shrink-0 bg-white border-b border-neutral-100 app-safe-top">
      <div className="h-14 px-5 flex items-center justify-between">
        <PayzedLogo className="text-black" size="md" />
        <button
          type="button"
          onClick={() => setActiveTab('parametres')}
          aria-label="Mon profil"
          className="w-10 h-10 rounded-full overflow-hidden bg-black text-white flex items-center justify-center font-bold text-sm active:scale-95 transition-transform"
        >
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
        </button>
      </div>
    </header>
  );
};
