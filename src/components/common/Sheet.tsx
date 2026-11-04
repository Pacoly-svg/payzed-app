import React, { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { useBackHandler } from '../../utils/backStack';

interface SheetProps {
  title: string;
  onClose: () => void;
  /** Affiche une flèche retour (sous-écran dans la fenêtre). */
  onBack?: () => void;
  children: React.ReactNode;
  /** Bouton fixé en bas de la fenêtre (toujours visible au-dessus du clavier). */
  footer?: React.ReactNode;
  /** Des informations ont été saisies : demander confirmation avant d'abandonner. */
  confirmClose?: boolean;
}

/** Fenêtre qui monte du bas de l'écran — facile à atteindre au pouce. */
export const Sheet: React.FC<SheetProps> = ({ title, onClose, onBack, children, footer, confirmClose }) => {
  const [asking, setAsking] = useState(false);

  const requestClose = () => (confirmClose ? setAsking(true) : onClose());

  // Retour Android / Échap : confirmation → sous-écran → fenêtre
  useBackHandler(() => {
    if (asking) setAsking(false);
    else if (onBack) onBack();
    else requestClose();
    return true;
  });

  return (
    <div className="kb-aware fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="Fermer" onClick={requestClose} className="absolute inset-0 bg-black/45 cursor-default animate-fade" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-[480px] max-h-[92%] bg-white rounded-t-[28px] flex flex-col animate-sheet-up app-safe-bottom"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-neutral-200 shrink-0" />
        <div className="flex items-center gap-2 px-5 pt-3 pb-4 shrink-0">
          {onBack && (
            <button type="button" onClick={onBack} aria-label="Retour" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-neutral-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="flex-1 text-xl font-bold truncate">{title}</h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Fermer"
            className="w-10 h-10 -mr-1 rounded-full bg-neutral-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pb-6 scroll-pb-6">{children}</div>
        {footer && <div className="px-5 pt-2 pb-5 shrink-0 bg-white">{footer}</div>}

        {asking && (
          <div className="absolute inset-0 z-10 rounded-t-[28px] bg-white/95 flex flex-col justify-end p-5 animate-fade" role="alertdialog" aria-label="Abandonner l'opération ?">
            <p className="text-xl font-bold">Abandonner l'opération ?</p>
            <p className="text-[15px] text-neutral-500 mt-1">Les informations saisies ne seront pas enregistrées.</p>
            <div className="space-y-2 mt-6">
              <button type="button" onClick={() => setAsking(false)} className="w-full h-14 rounded-full bg-black text-white font-bold text-[15px]">
                Continuer l'opération
              </button>
              <button type="button" onClick={onClose} className="w-full h-14 rounded-full bg-neutral-100 text-red-600 font-bold text-[15px]">
                Abandonner
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
