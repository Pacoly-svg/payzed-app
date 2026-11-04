/* eslint-disable react-refresh/only-export-components */
import React from 'react';

/**
 * Emojis des coffres d'épargne : images haute qualité pour les 10 icônes proposées,
 * emoji natif du téléphone pour tout autre caractère (repli automatique).
 */
const EMOJI_IMAGES: Record<string, string> = {
  '🎯': '/emojis/target.png',
  '🏢': '/emojis/building.png',
  '🛡️': '/emojis/shield.png',
  '🛡': '/emojis/shield.png',
  '✈️': '/emojis/airplane.png',
  '✈': '/emojis/airplane.png',
  '🚗': '/emojis/car.png',
  '💍': '/emojis/ring.png',
  '💰': '/emojis/money.png',
  '🏠': '/emojis/house.png',
  '🌴': '/emojis/island.png',
  '🔒': '/emojis/lock.png',
};

export const POPULAR_VAULT_EMOJIS = ['🎯', '🏢', '🛡️', '✈️', '🚗', '💍', '💰', '🏠', '🌴', '🔒'];

export const AppleEmoji: React.FC<{ emoji: string; size?: number; className?: string }> = ({ emoji, size = 24, className = '' }) => {
  const src = EMOJI_IMAGES[emoji.trim()];
  if (src) {
    return (
      <img
        src={src}
        alt={emoji}
        width={size}
        height={size}
        decoding="async"
        className={`inline-block object-contain select-none shrink-0 pointer-events-none ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span className={`inline-flex items-center justify-center select-none ${className}`} style={{ fontSize: size * 0.85, lineHeight: 1 }}>
      {emoji}
    </span>
  );
};
