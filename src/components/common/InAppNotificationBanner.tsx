import React from 'react';
import { X, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { BrandLogo } from './BrandLogo';

export const InAppNotificationBanner: React.FC = () => {
  const { inAppNotification, dismissNotification, setSelectedTransaction, transactions } = useBanking();

  if (!inAppNotification) return null;

  const isCredit = inAppNotification.type === 'in';

  const handleClick = () => {
    const latestMatch = transactions[0];
    if (latestMatch) {
      setSelectedTransaction(latestMatch);
    }
    dismissNotification();
  };

  return (
    <div 
      className="fixed left-0 right-0 z-[100] px-3 sm:px-4 flex justify-center pointer-events-none animate-in slide-in-from-top-6 duration-300"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
    >
      <div 
        onClick={handleClick}
        className="pointer-events-auto w-full max-w-sm rounded-3xl bg-white/98 border border-neutral-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.08)] p-3.5 flex items-start gap-3 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.99] backdrop-blur-xl"
      >
        {/* Brand / Bank Logo */}
        <div className="shrink-0 pt-0.5">
          {inAppNotification.brandLogo ? (
            <BrandLogo brand={inAppNotification.brandLogo} size={42} className="rounded-2xl shadow-xs" />
          ) : (
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isCredit ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-800'
            }`}>
              {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              Payzed • Notification
            </span>
            <span className="text-[9px] text-neutral-400 font-semibold">À l'instant</span>
          </div>

          <h4 className="text-xs font-bold text-black truncate">
            {inAppNotification.title}
          </h4>

          <p className="text-[11px] text-neutral-600 line-clamp-2 mt-0.5 font-medium leading-snug">
            {inAppNotification.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismissNotification();
          }}
          className="p-1 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
