import React from 'react';

const APPLE_EMOJI_MAP: Record<string, string> = {
  // Buildings / Real estate
  '🏢': '/emojis/building.png',
  'building': '/emojis/building.png',
  'immobilier': '/emojis/building.png',

  // Shield / Security
  '🛡️': '/emojis/shield.png',
  '🛡': '/emojis/shield.png',
  'shield': '/emojis/shield.png',
  'securite': '/emojis/shield.png',

  // Airplane / Travel
  '✈️': '/emojis/airplane.png',
  '✈': '/emojis/airplane.png',
  'airplane': '/emojis/airplane.png',
  'voyage': '/emojis/airplane.png',

  // Target / Goal
  '🎯': '/emojis/target.png',
  'target': '/emojis/target.png',
  'objectif': '/emojis/target.png',

  // Car / Transport
  '🚗': '/emojis/car.png',
  'car': '/emojis/car.png',
  'auto': '/emojis/car.png',

  // Ring / Wedding
  '💍': '/emojis/ring.png',
  'ring': '/emojis/ring.png',
  'mariage': '/emojis/ring.png',

  // Money
  '💰': '/emojis/money.png',
  'money': '/emojis/money.png',
  'argent': '/emojis/money.png',

  // House
  '🏠': '/emojis/house.png',
  'house': '/emojis/house.png',
  'maison': '/emojis/house.png',

  // Island / Vacation
  '🌴': '/emojis/island.png',
  'island': '/emojis/island.png',
  'vacances': '/emojis/island.png',

  // Lock
  '🔒': '/emojis/lock.png',
  'lock': '/emojis/lock.png',
  'coffre': '/emojis/lock.png',

  // Gift
  '🎁': '/emojis/gift.png',
  'gift': '/emojis/gift.png',
  'cadeau': '/emojis/gift.png',

  // Graduation
  '🎓': '/emojis/graduation.png',
  'graduation': '/emojis/graduation.png',
  'etudes': '/emojis/graduation.png',

  // Shopping
  '🛍️': '/emojis/shopping.png',
  '🛍': '/emojis/shopping.png',
  'shopping': '/emojis/shopping.png',

  // Laptop
  '💻': '/emojis/laptop.png',
  'laptop': '/emojis/laptop.png',
  'tech': '/emojis/laptop.png',

  // Phone
  '📱': '/emojis/phone.png',
  'phone': '/emojis/phone.png',

  // Diamond
  '💎': '/emojis/diamond.png',
  'diamond': '/emojis/diamond.png',

  // Trophy
  '🏆': '/emojis/trophy.png',
  'trophy': '/emojis/trophy.png',

  // Credit Card
  '💳': '/emojis/creditcard.png',
  'card': '/emojis/creditcard.png',

  // Key
  '🔑': '/emojis/key.png',
  'key': '/emojis/key.png',

  // Sparkles
  '✨': '/emojis/sparkles.png',
  'sparkles': '/emojis/sparkles.png',

  // Rocket
  '🚀': '/emojis/rocket.png',
  'rocket': '/emojis/rocket.png',

  // Heart
  '❤️': '/emojis/heart.png',
  'heart': '/emojis/heart.png',

  // Gold Coin
  '🪙': '/emojis/gold.png',
  'gold': '/emojis/gold.png',

  // Watch
  '⌚': '/emojis/watch.png',
  'watch': '/emojis/watch.png',
};

export const POPULAR_VAULT_EMOJIS = ['🎯', '🏢', '🛡️', '✈️', '🚗', '💍', '💰', '🏠', '🌴', '🔒'];

export const EXTENDED_VAULT_EMOJIS = [
  '🎯', '🏢', '🛡️', '✈️', '🚗', '💍', '💰', '🏠', '🌴', '🔒',
  '🎁', '🎓', '🛍️', '💻', '📱', '💎', '🏆', '💳', '🔑', '✨',
  '🚀', '❤️', '🪙', '⌚'
];

interface AppleEmojiProps {
  emoji: string;
  size?: number;
  className?: string;
  alt?: string;
}

export const AppleEmoji: React.FC<AppleEmojiProps> = ({ 
  emoji, 
  size = 24, 
  className = '', 
  alt 
}) => {
  const src = APPLE_EMOJI_MAP[emoji.trim()];

  if (src) {
    return (
      <img
        src={src}
        alt={alt || emoji}
        width={size}
        height={size}
        className={`inline-block object-contain select-none shrink-0 pointer-events-none drop-shadow-xs ${className}`}
        style={{ width: size, height: size }}
        loading="eager"
      />
    );
  }

  // Fallback to text emoji
  return (
    <span 
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ fontSize: size * 0.85, lineHeight: 1 }}
    >
      {emoji}
    </span>
  );
};
