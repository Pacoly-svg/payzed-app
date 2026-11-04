import React, { useEffect, useState } from 'react';
import { PayzedLogo } from './PayzedLogo';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 1300 }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Déclenchement de l'animation d'entrée
    const timerMount = setTimeout(() => setIsMounted(true), 40);

    // Début du fondu de sortie
    const timerFade = setTimeout(() => {
      setIsFadingOut(true);
    }, duration - 320);

    // Fin et unmount
    const timerDone = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(timerMount);
      clearTimeout(timerFade);
      clearTimeout(timerDone);
    };
  }, [duration, onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-100 bg-black flex items-center justify-center transition-all duration-350 ease-out select-none ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Centre : Logo Payzed Haute Couture avec animation fluide sur fond Full Black */}
      <div className="relative flex items-center justify-center">
        {/* Halo lumineux subtil en arrière-plan */}
        <div 
          className={`absolute w-36 h-36 rounded-full bg-white/10 blur-2xl transition-all duration-700 ease-out pointer-events-none ${
            isMounted ? 'scale-125 opacity-100' : 'scale-50 opacity-0'
          }`} 
        />

        {/* Logo Payzed Blanc Pur avec zoom et fondu élégant */}
        <div 
          className={`relative transform transition-all duration-600 ease-out ${
            isMounted 
              ? 'scale-100 opacity-100 translate-y-0' 
              : 'scale-90 opacity-0 translate-y-2'
          }`}
        >
          <PayzedLogo 
            size="lg" 
            className="h-11 sm:h-14 text-white drop-shadow-[0_2px_20px_rgba(255,255,255,0.3)]" 
          />
        </div>
      </div>
    </div>
  );
};
