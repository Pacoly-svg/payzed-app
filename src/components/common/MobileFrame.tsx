import React from 'react';

interface MobileFrameProps {
  header: React.ReactNode;
  children: React.ReactNode;
  bottomNav: React.ReactNode;
  scrollKey?: string;
}

/**
 * Structure de l'application :
 *  - la page elle-même ne défile jamais (plus de conflits de scroll sur Android) ;
 *  - un SEUL conteneur défile : le contenu central ;
 *  - l'en-tête et la barre du bas restent dans le flux (aucune couche invisible
 *    posée par-dessus les boutons).
 */
export const MobileFrame: React.FC<MobileFrameProps> = ({ header, children, bottomNav, scrollKey }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Revenir en haut à chaque changement d'onglet.
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [scrollKey]);

  return (
    <div className="app-shell">
      {header}
      <div ref={scrollRef} className="app-scroll">
        {children}
      </div>
      {bottomNav}
    </div>
  );
};
