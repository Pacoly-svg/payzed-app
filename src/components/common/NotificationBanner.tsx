import React from 'react';
import { X } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { useDemo } from '../../context/DemoContext';
import { BrandLogo } from './BrandLogo';
import { BACK_PRIORITY, useBackHandler } from '../../utils/backStack';

/** Notification qui descend du haut de l'écran (style notification système). */
export const NotificationBanner: React.FC = () => {
  const { notification, dismissNotification } = useDemo();
  const { setSelectedTransaction, isLocked } = useBanking();
  useBackHandler(() => dismissNotification(), Boolean(notification), BACK_PRIORITY.overlay);
  if (!notification) return null;

  const open = () => {
    if (!isLocked) setSelectedTransaction(notification.tx);
    dismissNotification();
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[70] px-3 app-safe-top pointer-events-none flex justify-center">
      <div
        role="alert"
        onClick={open}
        className="pointer-events-auto mt-2 w-full max-w-[460px] flex items-center gap-3 rounded-[22px] bg-white/95 backdrop-blur-xl p-3 pr-2 shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-black/5 animate-drop cursor-pointer"
      >
        <BrandLogo brand={notification.brand} size={44} className="rounded-xl" />
        <div className="flex-1 min-w-0">
          <p className="flex items-center justify-between gap-2">
            <span className="text-[15px] font-bold truncate">{notification.title}</span>
            <span className="text-[12px] text-neutral-500 shrink-0">maintenant</span>
          </p>
          <p className="text-[13px] text-neutral-600 leading-snug line-clamp-2">{notification.message}</p>
        </div>
        <button
          type="button"
          aria-label="Fermer la notification"
          onClick={(e) => {
            e.stopPropagation();
            dismissNotification();
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 shrink-0 active:bg-neutral-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
