import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useBanking();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center space-x-2.5 px-5 py-3 rounded-2xl bg-black/95 text-white shadow-[0_12px_40px_rgba(0,0,0,0.3)] border border-neutral-700/80 backdrop-blur-xl pointer-events-auto">
        <CheckCircle2 className="w-4 h-4 text-white shrink-0 stroke-[2.2]" />
        <span className="text-xs font-semibold text-white tracking-wide">{toastMessage}</span>
      </div>
    </div>
  );
};
