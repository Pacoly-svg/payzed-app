import React, { useState } from 'react';

export type BrandLogoType = 
  | 'wave' 
  | 'netflix' 
  | 'senelec' 
  | 'seneau' 
  | 'woyofal' 
  | 'rapido' 
  | 'axa' 
  | 'orange_money'
  | 'orange'
  | 'yas'
  | 'expresso'
  | 'cbao'
  | 'sgbs'
  | 'ecobank'
  | 'paypal'
  | 'spotify'
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'dgid'
  | 'impots';

interface BrandLogoProps {
  brand: BrandLogoType | string;
  className?: string;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ brand, className = 'w-10 h-10', size = 40 }) => {
  const [imgError, setImgError] = useState(false);

  // 0. Support des logos personnalisés ajoutés par l'utilisateur (URL ou data-url base64)
  if (brand && (brand.startsWith('data:image/') || brand.startsWith('http://') || brand.startsWith('https://') || brand.startsWith('blob:'))) {
    return (
      <div 
        className={`rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-neutral-200/80 bg-white p-1 shadow-xs ${className}`}
        style={{ width: size, height: size }}
      >
        <img 
          src={brand} 
          alt="Canal personnalisé" 
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  const normalized = (brand || '').toLowerCase().trim();

  if (normalized === 'payzed') {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center overflow-hidden shrink-0 bg-black ${className}`}
        style={{ width: size, height: size, padding: Math.round(size * 0.22) }}
        title="Payzed"
      >
        <img src="/assets/logo/symbole-blanc.svg" alt="Payzed" className="w-full h-full object-contain" />
      </div>
    );
  }

  // 1. Logos avec fichiers officiels téléchargés
  let src = '';
  let alt = '';
  let bgClass = 'bg-white';
  let paddingClass = 'p-1';
  let objectFit = 'object-contain';

  if (normalized.includes('cbao') || normalized.includes('attijariwafa')) {
    src = '/logos/cbao.png';
    alt = 'CBAO Attijariwafa bank';
    bgClass = 'bg-white';
    paddingClass = 'p-0.5';
    objectFit = 'object-contain';
  } else if (normalized.includes('wave')) {
    src = '/logos/wave.png';
    alt = 'Wave';
    bgClass = 'bg-[#1DC3F3]';
    paddingClass = 'p-0';
    objectFit = 'object-cover';
  } else if (normalized.includes('yas') || normalized.includes('free')) {
    src = '/logos/yas.svg';
    alt = 'Yas Sénégal';
    bgClass = 'bg-[#06377a]';
    paddingClass = 'p-0.5';
    objectFit = 'object-contain';
  } else if (normalized.includes('expresso')) {
    src = '/logos/expresso.png';
    alt = 'Expresso Sénégal';
    bgClass = 'bg-[#FFD100]';
    paddingClass = 'p-0.5';
    objectFit = 'object-contain';
  } else if (normalized.includes('ecobank')) {
    src = '/logos/ecobank.png';
    alt = 'Ecobank The Pan African Bank';
    bgClass = 'bg-[#005B82]';
    paddingClass = 'p-0.5';
    objectFit = 'object-contain';
  } else if (normalized.includes('payzed') || normalized.includes('payzen')) {
    src = '/assets/logo/symbole-blanc.svg';
    alt = 'Payzed Direct';
    bgClass = 'bg-black';
    paddingClass = 'p-1.5';
    objectFit = 'object-contain';
  } else if (normalized.includes('woyofal')) {
    src = '/logos/woyofal.png';
    alt = 'Woyofal';
    bgClass = 'bg-white';
    paddingClass = 'p-1';
    objectFit = 'object-contain';
  } else if (normalized.includes('senelec')) {
    src = '/logos/senelec.png';
    alt = 'Senelec';
    bgClass = 'bg-white';
    paddingClass = 'p-1';
    objectFit = 'object-contain';
  } else if (normalized.includes('seneau') || normalized.includes("sen'eau")) {
    src = '/logos/seneau.png';
    alt = "Sen'Eau";
    bgClass = 'bg-white';
    paddingClass = 'p-1';
    objectFit = 'object-contain';
  } else if (normalized.includes('rapido')) {
    src = '/logos/rapido_icon.png';
    alt = "Rapido";
    bgClass = 'bg-white';
    paddingClass = 'p-1';
    objectFit = 'object-contain';
  } else if (normalized.includes('dgid') || normalized.includes('impot')) {
    src = '/logos/dgid.png';
    alt = 'DGID Impôts Sénégal';
    bgClass = 'bg-white';
    paddingClass = 'p-0.5';
    objectFit = 'object-contain';
  } else if (normalized.includes('paypal')) {
    src = '/logos/paypal_icon.svg';
    alt = 'PayPal';
    bgClass = 'bg-white';
    paddingClass = 'p-0.5';
    objectFit = 'object-contain';
  } else if (normalized.includes('spotify')) {
    src = '/logos/spotify.svg';
    alt = 'Spotify';
    bgClass = 'bg-[#1ED760]';
    paddingClass = 'p-0';
    objectFit = 'object-cover';
  } else if (normalized.includes('chatgpt') || normalized.includes('openai')) {
    src = '/logos/chatgpt_icon.svg';
    alt = 'ChatGPT Plus';
    bgClass = 'bg-white';
    paddingClass = 'p-0';
    objectFit = 'object-cover';
  } else if (normalized.includes('claude') || normalized.includes('anthropic')) {
    src = '/logos/claude.svg';
    alt = 'Claude Pro';
    bgClass = 'bg-[#D77655]';
    paddingClass = 'p-0';
    objectFit = 'object-cover';
  } else if (normalized.includes('gemini') || normalized.includes('google')) {
    src = '/logos/gemini.svg';
    alt = 'Google Gemini';
    bgClass = 'bg-white';
    paddingClass = 'p-1';
    objectFit = 'object-contain';
  } else if (normalized.includes('netflix')) {
    src = '/logos/netflix_icon.svg';
    alt = 'Netflix';
    bgClass = 'bg-black';
    paddingClass = 'p-1.5';
    objectFit = 'object-contain';
  } else if (normalized.includes('orange')) {
    src = '/logos/orange.svg';
    alt = 'Orange Sénégal';
    bgClass = 'bg-[#FF6600]';
    paddingClass = 'p-0';
    objectFit = 'object-contain';
  } else if (normalized.includes('axa')) {
    src = '/logos/axa.svg';
    alt = 'AXA';
    bgClass = 'bg-[#00008f]';
    paddingClass = 'p-0';
    objectFit = 'object-cover';
  }

  // 2. Si image trouvée
  if (src && !imgError) {
    const isColored = bgClass !== 'bg-white';
    return (
      <div 
        className={`rounded-2xl flex items-center justify-center overflow-hidden shrink-0 ${isColored ? 'border border-black/10' : 'border border-neutral-200/80'} shadow-xs ${bgClass} ${paddingClass} ${className}`}
        style={{ width: size, height: size }}
        title={alt}
      >
        <img 
          src={src} 
          alt={alt} 
          onError={() => setImgError(true)}
          className={`w-full h-full ${objectFit}`}
          loading="eager"
        />
      </div>
    );
  }

  // 3. Banques avec vector badge haute fidélité
  if (normalized.includes('sgbs') || normalized.includes('societe generale') || normalized.includes('société générale')) {
    return (
      <div 
        className={`rounded-2xl flex items-center justify-center overflow-hidden shrink-0 bg-white border border-neutral-200 shadow-xs p-1 ${className}`}
        style={{ width: size, height: size }}
        title="Société Générale Sénégal (SGBS)"
      >
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <rect y="0" width="100" height="47" rx="3" fill="#E60028" />
          <rect y="53" width="100" height="47" rx="3" fill="#000000" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#FFFFFF" strokeWidth="6" />
        </svg>
      </div>
    );
  }

  // Fallback propre monogramme
  return (
    <div 
      className={`rounded-2xl flex items-center justify-center overflow-hidden shrink-0 bg-black text-white font-bold uppercase ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {brand ? brand.trim().charAt(0) : '?'}
    </div>
  );
};
