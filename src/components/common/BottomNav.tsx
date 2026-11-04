import React, { useState, useEffect } from 'react';
import { 
  WalletCards, 
  BarChart3, 
  CreditCard, 
  Settings 
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import type { TabType } from '../../types/banking';

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useBanking();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Auto-hide bottom navigation when mobile keyboard opens to prevent covering inputs
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      // Delay slightly in case focus shifts to another input
      setTimeout(() => {
        const active = document.activeElement as HTMLElement;
        if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA' && active.tagName !== 'SELECT')) {
          setIsKeyboardOpen(false);
        }
      }, 100);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    const vv = window.visualViewport;
    const handleViewportResize = () => {
      if (vv && window.innerHeight) {
        if (vv.height < window.innerHeight * 0.78) {
          setIsKeyboardOpen(true);
        } else {
          setIsKeyboardOpen(false);
        }
      }
    };

    vv?.addEventListener('resize', handleViewportResize);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      vv?.removeEventListener('resize', handleViewportResize);
    };
  }, []);

  const items: NavItem[] = [
    { id: 'comptes', label: 'Comptes', icon: WalletCards },
    { id: 'statistiques', label: 'Statistiques', icon: BarChart3 },
    { id: 'cartes', label: 'Cartes', icon: CreditCard },
    { id: 'parametres', label: 'Paramètres', icon: Settings },
  ];

  return (
    <nav className={`w-full px-4 pb-safe pt-2 pointer-events-none transition-all duration-200 transform ${
      isKeyboardOpen ? 'opacity-0 translate-y-12 pointer-events-none' : 'opacity-100 translate-y-0'
    }`}
    style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
    >
      <div className="rounded-3xl p-1.5 flex items-center justify-around bg-white/95 border border-neutral-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-2xl pointer-events-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-3.5 sm:px-4 rounded-2xl transition-all duration-150 group active:scale-95 ${
                isActive 
                  ? 'text-white font-bold' 
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              {/* Pilule de fond active noire */}
              {isActive && (
                <div className="absolute inset-0 bg-black rounded-2xl shadow-xs -z-10 transition-all duration-200" />
              )}

              <div className="relative">
                <Icon 
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-105 stroke-[2.2] text-white' : 'stroke-[1.8] group-hover:scale-105 text-neutral-500 group-hover:text-black'
                  }`} 
                />
              </div>

              <span className={`text-[11px] mt-1 tracking-tight transition-all ${
                isActive ? 'text-white font-bold' : 'text-neutral-500 group-hover:text-black font-semibold'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
