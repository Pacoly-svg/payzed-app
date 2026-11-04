import { useEffect, useRef } from 'react';

/**
 * Pile de navigation « Retour » unique pour toute l'application.
 *
 * Chaque élément qui peut être fermé (fenêtre, sous-écran, confirmation, onglet)
 * s'inscrit dans la pile. Le bouton / geste Retour d'Android, la touche Échap et
 * les boutons « ← » de l'interface passent tous par ici : le dernier élément ouvert
 * est fermé en premier. Si plus rien ne peut être fermé, l'écran principal gère la
 * sortie (double appui) — l'app ne se ferme jamais par surprise.
 */

type Handler = () => boolean | void; // renvoie false si l'élément ne gère pas le retour

/** Priorités : écran de verrouillage > fenêtres > écran principal. */
export const BACK_PRIORITY = { root: 0, sheet: 10, overlay: 20, lock: 100 } as const;

const stack: { id: number; priority: number; handler: Handler }[] = [];
let nextId = 1;

export function pushBackHandler(handler: Handler, priority: number = BACK_PRIORITY.sheet): () => void {
  const id = nextId++;
  stack.push({ id, priority, handler });
  // Tri stable : priorité puis ordre d'ouverture (le plus récent en dernier)
  stack.sort((a, b) => a.priority - b.priority || a.id - b.id);
  return () => {
    const i = stack.findIndex((h) => h.id === id);
    if (i >= 0) stack.splice(i, 1);
  };
}

/** Exécute le retour sur l'élément le plus récent. Renvoie true si quelque chose a été fermé. */
export function handleBack(): boolean {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].handler() !== false) return true;
  }
  return false;
}

/** Inscrit un gestionnaire de retour tant que le composant est affiché (et `enabled`). */
export function useBackHandler(handler: Handler, enabled = true, priority: number = BACK_PRIORITY.sheet) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    if (!enabled) return;
    return pushBackHandler(() => ref.current(), priority);
  }, [enabled, priority]);
}

/** Branche le bouton/geste Retour Android et la touche Échap sur la pile. */
export async function setupBackNavigation(onRootExit: () => void) {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !handleBack()) onRootExit();
  });
  const { Capacitor } = await import('@capacitor/core');
  if (!Capacitor.isNativePlatform()) return;
  const { App } = await import('@capacitor/app');
  // Remplace le comportement par défaut (qui fermait l'app faute d'historique web)
  await App.addListener('backButton', () => {
    if (!handleBack()) onRootExit();
  });
}

/** Met l'app en arrière-plan (comportement Android standard), sans la tuer. */
export async function leaveApp() {
  const { Capacitor } = await import('@capacitor/core');
  if (!Capacitor.isNativePlatform()) return;
  const { App } = await import('@capacitor/app');
  await App.minimizeApp();
}
