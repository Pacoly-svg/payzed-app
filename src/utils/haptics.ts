/**
 * Mobile Haptic Feedback Engine
 * Provides subtle tactile feedback on mobile devices via the Vibration API
 */

export const haptic = {
  // Light touch when pressing buttons or tabs
  light: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignore if restricted by browser permissions
      }
    }
  },

  // Selection toggle (switch, checkbox, radio)
  selection: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignore
      }
    }
  },

  // Success haptic pulse (payment completed, unlock, copy)
  success: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([15, 40, 20]);
      } catch {
        // Ignore
      }
    }
  },

  // Error / Warning pulse (wrong PIN, insufficient balance)
  warning: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 50, 40]);
      } catch {
        // Ignore
      }
    }
  },
};
