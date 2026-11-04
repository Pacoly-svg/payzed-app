import React, { useState } from 'react';
import { brandOf } from '../../data/catalog';

interface BrandLogoProps {
  /** Id de service ou d'opérateur (« wave »), libellé (« Netflix Premium »), « payzed » ou image (data URL). */
  brand: string;
  className?: string;
  size?: number;
}

/*
 * Normalisation des logos — toutes les marques ont le même poids visuel :
 *  - conteneur carré identique (taille `size`, coins arrondis, liseré discret
 *    pour rester lisible sur fond clair comme sombre) ;
 *  - logos « pleins » (fond de marque) : remplissent la case ;
 *  - logos horizontaux / transparents : centrés avec une marge constante de 14 %,
 *    sans jamais être étirés (object-contain) ;
 *  - sans logo officiel : repère neutre (initiales grises), jamais un faux logo.
 */
const tile = 'rounded-2xl flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-black/[0.06]';

const initials = (name: string) =>
  name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const BrandLogo: React.FC<BrandLogoProps> = ({ brand, className = '', size = 40 }) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const box = { width: size, height: size };
  const key = (brand || '').trim();

  // Logo personnalisé (canal ajouté par l'utilisateur dans SIM)
  if (/^(data:image\/|https?:|blob:)/.test(key) && failedSrc !== key) {
    return (
      <span className={`${tile} bg-white ${className}`} style={box}>
        <img src={key} alt="" className="w-full h-full object-contain p-[14%]" onError={() => setFailedSrc(key)} />
      </span>
    );
  }

  if (key.toLowerCase() === 'payzed') {
    return (
      <span className={`${tile} bg-black ${className}`} style={{ ...box, padding: Math.round(size * 0.22) }} title="Payzed">
        <img src="/assets/logo/symbole-blanc.svg" alt="Payzed" className="w-full h-full object-contain" />
      </span>
    );
  }

  const b = brandOf(key);
  if (b?.logo && failedSrc !== b.logo) {
    const contain = b.fit === 'contain';
    return (
      <span className={`${tile} bg-white ${className}`} style={box} title={b.name}>
        <img
          src={b.logo}
          alt={b.name}
          width={size}
          height={size}
          decoding="async"
          draggable={false}
          onError={() => setFailedSrc(b.logo!)}
          className={`w-full h-full ${contain ? 'object-contain p-[14%]' : 'object-cover'}`}
        />
      </span>
    );
  }

  // Repère neutre : aucun logo officiel vérifiable n'est disponible pour cette marque
  return (
    <span
      className={`${tile} bg-neutral-100 text-neutral-600 font-bold ${className}`}
      style={{ ...box, fontSize: Math.max(10, Math.round(size * 0.32)) }}
      title={b?.name ?? key}
      aria-label={b?.name ?? key}
    >
      {initials(b?.name ?? key) || '?'}
    </span>
  );
};
