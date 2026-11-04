import React from 'react';
import { ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';

export const OnboardingScreen: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen } = useBanking();

  if (!isOnboardingOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white text-black flex flex-col justify-between p-6 sm:p-8 animate-in fade-in duration-200 overflow-y-auto">
      {/* En-tête : Logo Payzed Noir et Fermeture */}
      <div className="flex items-center justify-between pt-2">
        <img 
          src="/assets/logo/logo-principal.svg" 
          alt="Payzed" 
          className="h-6 sm:h-7 w-auto object-contain"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = '/assets/logo/symbole-noir.svg';
          }}
        />
        <button
          onClick={() => setIsOnboardingOpen(false)}
          className="text-xs font-semibold text-neutral-600 hover:text-black px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 transition-colors"
        >
          Passer
        </button>
      </div>

      {/* Visuel Abstrait Géométrique Monochrome */}
      <div className="relative my-auto py-8 flex flex-col items-center justify-center">
        {/* Composition Graphique Vectorielle Monochrome */}
        <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square flex items-center justify-center">
          <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.08)]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="monochromeGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#52525b" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#a1a1aa" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="monochromeDarkLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#18181b" />
                <stop offset="50%" stopColor="#27272a" />
                <stop offset="100%" stopColor="#3f3f46" />
              </linearGradient>
            </defs>

            {/* Cercles orbitaux architecturaux */}
            <circle cx="200" cy="200" r="160" stroke="#e4e4e7" strokeWidth="1" strokeDasharray="4 6" fill="none" />
            <circle cx="200" cy="200" r="120" stroke="#d4d4d8" strokeWidth="1" strokeDasharray="3 8" fill="none" opacity="0.8" />

            {/* Rubans 3D stylisés monochromes */}
            <path 
              d="M80,240 C110,120 280,100 320,200 C350,270 240,320 160,290 C100,270 60,340 120,360" 
              fill="none" 
              stroke="url(#monochromeDarkLight)" 
              strokeWidth="20" 
              strokeLinecap="round" 
            />
            <path 
              d="M100,160 C140,80 260,80 300,160 C330,220 220,300 140,240 C90,200 130,120 220,130" 
              fill="none" 
              stroke="url(#monochromeGradLight)" 
              strokeWidth="12" 
              strokeLinecap="round" 
            />

            {/* Médaillon central avec Monogramme Officiel Payzed */}
            <circle cx="200" cy="200" r="42" fill="#000000" stroke="#ffffff" strokeWidth="2" />
            <g transform="translate(180, 178) scale(0.04)">
              <path 
                fill="#ffffff" 
                d="M256.278,305.605L50,50h704.036c0,0,210.762,62.78,210.762,345.291 c0,0-8.969,260.09-251.121,300.448l-318.386,8.969l-4.484,188.341L50,1050l71.749-497.758c0,0,49.327-147.982,233.184-161.435 l80.717-4.484l-22.422,201.794L538.789,467.04h134.529c0,0,80.718-4.484,76.233-89.686c0,0-22.422-89.686-94.17-85.202 S256.278,305.605,256.278,305.605z"
              />
            </g>
          </svg>
        </div>

        {/* Pilules de Fonctionnalités en Noir & Blanc */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <span className="px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-[11px] text-neutral-800 font-semibold flex items-center space-x-1.5 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
            <span>Sécurité certifiée</span>
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-[11px] text-neutral-800 font-semibold flex items-center space-x-1.5 shadow-xs">
            <Zap className="w-3.5 h-3.5 text-black" />
            <span>Paiements instantanés</span>
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-[11px] text-neutral-800 font-semibold flex items-center space-x-1.5 shadow-xs">
            <Globe className="w-3.5 h-3.5 text-black" />
            <span>Multi-devises direct</span>
          </span>
        </div>
      </div>

      {/* Typographie & Bouton d'Accès */}
      <div className="space-y-6 pb-4">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl text-black font-extrabold tracking-tight leading-tight">
            Payzed.<br />
            La banque privée mobile.
          </h1>

          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-sm font-medium">
            Réglez vos achats par QR code instantané, gérez votre carte virtuelle Black et effectuez vos virements en toute sérénité.
          </p>
        </div>

        {/* Bouton Capsule Noir avec Flèche Blanche */}
        <button
          onClick={() => setIsOnboardingOpen(false)}
          className="w-full py-4 px-6 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-sm shadow-xl flex items-center justify-between transition-all active:scale-[0.98] group"
        >
          <span className="tracking-wide text-white">Accéder à mon espace Payzed</span>
          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transition-transform group-hover:translate-x-1">
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </button>
      </div>
    </div>
  );
};
