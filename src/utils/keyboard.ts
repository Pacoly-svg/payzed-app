/**
 * Gestion du clavier Android : le champ en cours de saisie reste TOUJOURS visible.
 *
 * - Si la WebView est réduite par le clavier : on recentre simplement le champ.
 * - Si le clavier se pose PAR-DESSUS l'app : on mesure sa hauteur (visualViewport)
 *   et on remonte l'app et les fenêtres d'autant (variable CSS --kb).
 * - Pendant la saisie, la barre de navigation du bas est masquée (classe .kb-open).
 */
const isEditable = (el: Element | null): el is HTMLElement =>
  !!el &&
  ((el instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit', 'file', 'range'].includes(el.type)) ||
    el instanceof HTMLTextAreaElement ||
    (el as HTMLElement).isContentEditable);

export function setupKeyboardHandling() {
  const root = document.documentElement;
  const vv = window.visualViewport;
  let fullHeight = window.innerHeight;

  const update = () => {
    const editing = isEditable(document.activeElement);
    if (!editing) fullHeight = Math.max(fullHeight, window.innerHeight);
    const overlay = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
    const resized = fullHeight - window.innerHeight;
    root.style.setProperty('--kb', `${overlay > 60 ? overlay : 0}px`);
    root.classList.toggle('kb-open', editing && (overlay > 60 || resized > 120));
  };

  const reveal = (el: HTMLElement) => {
    // Attendre l'ouverture du clavier puis centrer le champ dans sa zone défilante
    [120, 350, 650].forEach((ms) =>
      setTimeout(() => {
        if (document.activeElement === el) {
          update();
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, ms),
    );
  };

  document.addEventListener('focusin', (e) => {
    if (isEditable(e.target as Element)) reveal(e.target as HTMLElement);
    update();
  });
  document.addEventListener('focusout', () => setTimeout(update, 120));
  vv?.addEventListener('resize', update);
  vv?.addEventListener('scroll', update);
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', () => {
    fullHeight = 0;
    setTimeout(update, 300);
  });
  update();
}
