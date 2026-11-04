import React, { useState } from 'react';
import { findProvider } from '../../data/catalog';

interface BrandLogoProps {
  /** Id du catalogue (« wave »), libellé (« Netflix Premium »), « payzed » ou image (data URL). */
  brand: string;
  className?: string;
  size?: number;
}

const tile = 'rounded-2xl flex items-center justify-center overflow-hidden shrink-0';

/** Icône carrée d'un opérateur ou service — toujours lisible, quelle que soit la taille. */
export const BrandLogo: React.FC<BrandLogoProps> = ({ brand, className = '', size = 40 }) => {
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size };
  const key = (brand || '').trim();

  // Logo personnalisé (canal ajouté par l'utilisateur)
  if (/^(data:image\/|https?:|blob:)/.test(key) && !failed) {
    return (
      <span className={`${tile} bg-white ring-1 ring-black/5 ${className}`} style={box}>
        <img src={key} alt="" className="w-full h-full object-contain p-[12%]" onError={() => setFailed(true)} />
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

  const p = findProvider(key);

  if (p?.logo && !failed) {
    const contain = p.fit === 'contain';
    return (
      <span className={`${tile} bg-white ring-1 ring-black/5 ${className}`} style={box} title={p.name}>
        <img
          src={p.logo}
          alt={p.name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={`w-full h-full ${contain ? 'object-contain p-[14%]' : 'object-cover'}`}
        />
      </span>
    );
  }

  // Monogramme (service sans logo officiel disponible) ou repli
  const label = p?.mono ?? (p?.name ?? key).charAt(0).toUpperCase();
  return (
    <span
      className={`${tile} font-extrabold tracking-tight ${className}`}
      style={{ ...box, background: p?.bg ?? '#000', color: p?.fg ?? '#fff', fontSize: Math.round(size * (label.length > 2 ? 0.3 : 0.4)) }}
      title={p?.name ?? key}
    >
      {label}
    </span>
  );
};
