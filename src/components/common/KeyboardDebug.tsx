import React, { useEffect, useState } from 'react';
import type { KeyboardDebug as KbInfo } from '../../utils/keyboard';

export const KB_DEBUG_KEY = 'payzed_kb_debug';

/**
 * Diagnostic clavier (caché) : touchez 5 fois la version dans Profil pour l'afficher.
 * Une capture d'écran de ce panneau permet de diagnostiquer un téléphone à distance.
 */
export const KeyboardDebug: React.FC = () => {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(KB_DEBUG_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [info, setInfo] = useState<KbInfo | undefined>();

  useEffect(() => {
    const onToggle = () => setEnabled(localStorage.getItem(KB_DEBUG_KEY) === '1');
    const onKb = () => setInfo({ ...(window as unknown as { __kb?: KbInfo }).__kb! });
    window.addEventListener('payzed:kb-debug', onToggle);
    window.addEventListener('payzed:kb', onKb);
    onKb();
    return () => {
      window.removeEventListener('payzed:kb-debug', onToggle);
      window.removeEventListener('payzed:kb', onKb);
    };
  }, []);

  if (!enabled || !info) return null;
  const webview = /Chrome\/(\d+)/.exec(navigator.userAgent)?.[1] ?? '?';
  return (
    <div className="fixed left-2 top-16 z-[80] pointer-events-none rounded-xl bg-black/80 text-white text-[11px] leading-4 font-mono px-2.5 py-2">
      <div>webview {webview}</div>
      <div>inner {info.innerHeight} / full {info.fullHeight}</div>
      <div>visual {info.visualHeight}</div>
      <div>android kb {info.nativeKeyboard}</div>
      <div>resized {info.resizedBy} · lift {info.lift}</div>
      <div>
        {info.open ? 'OUVERT' : 'fermé'} · {info.source}
      </div>
    </div>
  );
};
