import { Capacitor } from '@capacitor/core';

/**
 * Clavier Android : le champ en cours de saisie reste TOUJOURS visible.
 *
 * Trois sources d'information sont combinées, car selon la version d'Android,
 * de la WebView et du clavier (Samsung, Gboard…), le comportement diffère :
 *  1. Le plugin natif Capacitor Keyboard → hauteur exacte du clavier (la plus fiable).
 *  2. window.innerHeight → la WebView a-t-elle été réduite par Android ?
 *  3. visualViewport → le clavier est-il posé PAR-DESSUS la page ?
 *
 * Résultat : la variable CSS --kb = hauteur du clavier qui RECOUVRE l'app
 * (0 si Android a déjà réduit la page). L'app et les fenêtres remontent d'autant,
 * la barre du bas est masquée (.kb-open) et le champ actif est recentré.
 */

export interface KeyboardDebug {
  innerHeight: number;
  fullHeight: number;
  visualHeight: number;
  nativeKeyboard: number;
  resizedBy: number;
  lift: number;
  open: boolean;
  source: string;
}

const isEditable = (el: Element | null): el is HTMLElement =>
  !!el &&
  ((el instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit', 'file', 'range', 'reset', 'image'].includes(el.type)) ||
    el instanceof HTMLTextAreaElement ||
    (el as HTMLElement).isContentEditable);

export function setupKeyboardHandling() {
  const root = document.documentElement;
  const vv = window.visualViewport;
  let fullHeight = window.innerHeight;
  let nativeKb = 0; // hauteur donnée par Android (px CSS), 0 = fermé
  let nativeAvailable = false;

  const apply = () => {
    const editing = isEditable(document.activeElement);
    if (nativeKb === 0 && !editing) fullHeight = Math.max(fullHeight, window.innerHeight);

    const resizedBy = Math.max(0, fullHeight - window.innerHeight);
    const overlay = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;

    let lift = 0;
    let source = 'none';
    if (nativeKb > 0) {
      // Partie du clavier qui recouvre encore la page après un éventuel redimensionnement
      const covered = nativeKb - resizedBy;
      lift = covered > nativeKb * 0.35 ? covered : 0;
      source = lift ? 'native-overlay' : 'native-resized';
    } else if (!nativeAvailable && overlay > 60) {
      lift = overlay;
      source = 'visual-viewport';
    } else if (resizedBy > 120 && editing) {
      source = 'resized';
    }

    const open = nativeKb > 0 || lift > 0 || (editing && resizedBy > 120);
    root.style.setProperty('--kb', `${Math.round(lift)}px`);
    root.classList.toggle('kb-open', open);

    (window as unknown as { __kb?: KeyboardDebug }).__kb = {
      innerHeight: window.innerHeight,
      fullHeight,
      visualHeight: vv ? Math.round(vv.height) : window.innerHeight,
      nativeKeyboard: nativeKb,
      resizedBy,
      lift: Math.round(lift),
      open,
      source,
    };
    window.dispatchEvent(new Event('payzed:kb'));
  };

  /** Recentre le champ actif dans sa zone défilante (plusieurs fois, le clavier s'anime). */
  const reveal = () => {
    [60, 250, 500, 800].forEach((ms) =>
      setTimeout(() => {
        const el = document.activeElement;
        if (!isEditable(el)) return;
        apply();
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: ms < 300 ? 'auto' : 'smooth' });
      }, ms),
    );
  };

  document.addEventListener('focusin', (e) => {
    if (isEditable(e.target as Element)) reveal();
    apply();
  });
  document.addEventListener('focusout', () => setTimeout(apply, 150));
  // Saisie : si le champ a glissé hors de vue (ex. message d'erreur ajouté), on le ramène
  document.addEventListener('input', (e) => {
    const el = e.target as HTMLElement;
    const r = el.getBoundingClientRect?.();
    const bottomLimit = (vv?.height ?? window.innerHeight) - 8;
    if (r && (r.bottom > bottomLimit || r.top < 0)) el.scrollIntoView({ block: 'center' });
  });
  vv?.addEventListener('resize', apply);
  vv?.addEventListener('scroll', apply);
  window.addEventListener('resize', () => {
    apply();
    if (isEditable(document.activeElement)) reveal();
  });
  window.addEventListener('orientationchange', () => {
    fullHeight = 0;
    setTimeout(apply, 300);
  });

  // Hauteur exacte du clavier fournie par Android (APK uniquement)
  if (Capacitor.isNativePlatform()) {
    import('@capacitor/keyboard')
      .then(({ Keyboard }) => {
        void Keyboard.addListener('keyboardWillShow', (info) => {
          nativeAvailable = true;
          nativeKb = info.keyboardHeight;
          root.classList.add('kb-open');
        });
        void Keyboard.addListener('keyboardDidShow', (info) => {
          nativeAvailable = true;
          nativeKb = info.keyboardHeight;
          apply();
          reveal();
        });
        void Keyboard.addListener('keyboardWillHide', () => {
          nativeKb = 0;
        });
        void Keyboard.addListener('keyboardDidHide', () => {
          nativeKb = 0;
          apply();
        });
      })
      .catch(() => undefined);
  }

  apply();
}
