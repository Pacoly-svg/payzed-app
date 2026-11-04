import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Fenêtre qui monte du bas de l'écran — facile à atteindre au pouce. */
export const Sheet: React.FC<SheetProps> = ({ title, onClose, children }) => {
  // Bouton retour Android / touche Échap → fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-black/50 cursor-default" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-[480px] max-h-[90%] bg-white rounded-t-[28px] flex flex-col animate-sheet-up app-safe-bottom"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="p-2 -mr-2 rounded-full bg-neutral-100 active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pb-6">{children}</div>
      </div>
    </div>
  );
};
