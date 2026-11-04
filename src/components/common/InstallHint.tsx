import React, { useState } from 'react';
import { Share, SquarePlus, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const KEY = 'payzed_install_hint_closed';

/** iPhone dans Safari (pas encore installé) : comment ajouter Payzed à l'écran d'accueil. */
const shouldShow = () => {
  try {
    if (Capacitor.isNativePlatform()) return false;
    if (!/iPhone|iPad|iPod/.test(navigator.userAgent)) return false;
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    return !standalone && localStorage.getItem(KEY) !== '1';
  } catch {
    return false;
  }
};

export const InstallHint: React.FC = () => {
  const [show, setShow] = useState(shouldShow);
  if (!show) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // ignore
    }
    setShow(false);
  };
  return (
    <div className="rounded-3xl bg-neutral-100 p-4 flex gap-3" role="note" aria-label="Installer Payzed">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold">Installer Payzed sur l'iPhone</p>
        <p className="text-[13px] text-neutral-600 mt-1 leading-relaxed">
          Touchez <Share className="inline w-4 h-4 -mt-1" aria-label="Partager" /> en bas de Safari, puis{' '}
          <span className="font-semibold whitespace-nowrap">
            <SquarePlus className="inline w-4 h-4 -mt-1" /> Sur l'écran d'accueil
          </span>
          . Payzed s'ouvrira en plein écran, comme une app.
        </p>
      </div>
      <button type="button" onClick={close} aria-label="Fermer" className="w-8 h-8 -mt-1 -mr-1 rounded-full flex items-center justify-center active:bg-neutral-200 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
