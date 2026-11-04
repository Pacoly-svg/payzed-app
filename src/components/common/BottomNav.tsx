import React from 'react';
import { BarChart3, CreditCard, Home, User } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import type { TabType } from '../../types/banking';
import { haptic } from '../../utils/haptics';

const ITEMS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'comptes', label: 'Accueil', icon: Home },
  { id: 'statistiques', label: 'Stats', icon: BarChart3 },
  { id: 'cartes', label: 'Carte', icon: CreditCard },
  { id: 'parametres', label: 'Profil', icon: User },
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useBanking();

  return (
    <nav className="app-nav shrink-0 bg-white border-t border-neutral-100 app-safe-bottom">
      <div className="h-16 grid grid-cols-4">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (!active) haptic.light();
                setActiveTab(id);
              }}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-1 active:bg-neutral-50"
            >
              <span className={`px-5 py-1 rounded-full transition-colors ${active ? 'bg-black text-white' : 'text-neutral-400'}`}>
                <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className={`text-[11px] ${active ? 'font-bold text-black' : 'font-medium text-neutral-500'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
