import React from 'react';

export type CountryCode = 'CI' | 'SN' | 'FR' | 'US' | 'GB';

interface CountryFlagProps {
  country: CountryCode;
  className?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ country, className = 'w-5 h-3.5 rounded-[2px]' }) => {
  switch (country) {
    case 'CI': // Côte d'Ivoire: Orange, White, Green
      return (
        <svg viewBox="0 0 900 600" className={`${className} shadow-sm border border-white/10 shrink-0`} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="600" fill="#F77F00" />
          <rect x="300" width="300" height="600" fill="#FFFFFF" />
          <rect x="600" width="300" height="600" fill="#009A44" />
        </svg>
      );
    case 'SN': // Sénégal: Green, Yellow with Green Star, Red
      return (
        <svg viewBox="0 0 900 600" className={`${className} shadow-sm border border-white/10 shrink-0`} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="600" fill="#00853F" />
          <rect x="300" width="300" height="600" fill="#FDEF42" />
          <rect x="600" width="300" height="600" fill="#E31B23" />
          <polygon points="450,210 468,268 528,268 479,304 498,362 450,326 402,362 421,304 372,268 432,268" fill="#00853F" />
        </svg>
      );
    case 'FR': // France: Blue, White, Red
      return (
        <svg viewBox="0 0 900 600" className={`${className} shadow-sm border border-white/10 shrink-0`} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="600" fill="#002395" />
          <rect x="300" width="300" height="600" fill="#FFFFFF" />
          <rect x="600" width="300" height="600" fill="#ED2939" />
        </svg>
      );
    case 'US': // United States
      return (
        <svg viewBox="0 0 7410 3900" className={`${className} shadow-sm border border-white/10 shrink-0`} xmlns="http://www.w3.org/2000/svg">
          <rect width="7410" height="3900" fill="#B22234" />
          <path d="M0,450H7410M0,1050H7410M0,1650H7410M0,2250H7410M0,2850H7410M0,3450H7410" stroke="#FFF" strokeWidth="300" />
          <rect width="2964" height="2100" fill="#3C3B6E" />
          <circle cx="1482" cy="1050" r="400" fill="#FFF" opacity="0.9" />
        </svg>
      );
    case 'GB': // United Kingdom
      return (
        <svg viewBox="0 0 60 30" className={`${className} shadow-sm border border-white/10 shrink-0`} xmlns="http://www.w3.org/2000/svg">
          <clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
          <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
          <g clipPath="url(#s)">
            <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
          </g>
        </svg>
      );
  }
};
