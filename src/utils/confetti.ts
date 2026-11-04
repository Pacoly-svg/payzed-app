import { haptic } from './haptics';

/** Retour de succès léger (vibration courte) — remplace l'animation confettis trop lourde. */
export const triggerSuccessConfetti = () => {
  haptic.success();
};
