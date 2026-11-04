import { Capacitor } from '@capacitor/core';

/** 'android' | 'ios' | 'web' */
export const platform = () => Capacitor.getPlatform();
export const isIOS = () => platform() === 'ios' || (platform() === 'web' && /iPhone|iPad|iPod/.test(navigator.userAgent));

/** Nom du déverrouillage biométrique selon le téléphone. */
export const biometricName = () => (isIOS() ? 'Face ID' : 'Empreinte digitale');
