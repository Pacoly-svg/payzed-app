/**
 * Clavier Android : le champ en cours de saisie reste visible, le texte s'affiche en direct.
 *
 * Fonctionnement (v1.7) : Android redimensionne lui-même la fenêtre quand le clavier
 * s'ouvre (`adjustResize`, sans mode « bord à bord »). Ce script se contente de :
 *  - recentrer le champ actif une fois le clavier ouvert (jamais pendant la frappe,
 *    pour ne pas perturber la saisie prédictive du clavier) ;
 *  - masquer la barre du bas pendant la saisie (classe .kb-open) ;
 *  - en secours, si un clavier se pose PAR-DESSUS la page sans la réduire (rare),
 *    remonter l'app de la hauteur recouverte (variable CSS --kb).
 */

export interface KeyboardDebug {
  innerHeight: number;
  fullHeight: number;
  visualHeight: number;
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
  let lastLift = -1;
  let lastOpen: boolean | null = null;

  const apply = () => {
    const editing = isEditable(document.activeElement);
    if (!editing) fullHeight = Math.max(fullHeight, window.innerHeight);

    const resizedBy = Math.max(0, fullHeight - window.innerHeight);
    const overlay = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
    const lift = editing && overlay > 80 ? overlay : 0;
    const open = editing && (resizedBy > 120 || lift > 0);

    // N'écrire dans le DOM que si quelque chose change (aucun travail pendant la frappe)
    if (lift !== lastLift) {
      root.style.setProperty('--kb', `${lift}px`);
      lastLift = lift;
    }
    if (open !== lastOpen) {
      root.classList.toggle('kb-open', open);
      lastOpen = open;
    }

    (window as unknown as { __kb?: KeyboardDebug }).__kb = {
      innerHeight: window.innerHeight,
      fullHeight,
      visualHeight: vv ? Math.round(vv.height) : window.innerHeight,
      resizedBy,
      lift,
      open,
      source: lift ? 'clavier par-dessus' : resizedBy > 120 ? 'fenêtre réduite' : 'fermé',
    };
    window.dispatchEvent(new Event('payzed:kb'));
  };

  /** Recentre le champ actif (après l'animation d'ouverture du clavier). */
  const reveal = () => {
    [150, 450].forEach((ms) =>
      setTimeout(() => {
        const el = document.activeElement;
        if (!isEditable(el)) return;
        apply();
        const r = el.getBoundingClientRect();
        const visible = vv ? vv.height : window.innerHeight;
        if (r.top < 60 || r.bottom > visible - 16) el.scrollIntoView({ block: 'center', inline: 'nearest' });
      }, ms),
    );
  };

  document.addEventListener('focusin', (e) => {
    apply();
    if (isEditable(e.target as Element)) reveal();
  });
  document.addEventListener('focusout', () => setTimeout(apply, 150));
  vv?.addEventListener('resize', apply);
  window.addEventListener('resize', () => {
    apply();
    if (isEditable(document.activeElement)) reveal();
  });
  window.addEventListener('orientationchange', () => {
    fullHeight = 0;
    setTimeout(apply, 300);
  });
  apply();
}
