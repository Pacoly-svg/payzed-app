import { Capacitor } from '@capacitor/core';

export interface DeviceSummary {
  /** Nom de l'appareil (ex. « Galaxy S9+ »). */
  name: string;
  /** Fabricant et modèle (ex. « Samsung SM-G965F »). */
  model: string;
  /** Système (ex. « Android 10 »). */
  os: string;
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Appareil utilisé (plugin natif dans l'APK, user-agent dans le navigateur). */
export async function deviceSummary(): Promise<DeviceSummary> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Device } = await import('@capacitor/device');
      const i = await Device.getInfo();
      const model = `${cap(i.manufacturer ?? '')} ${i.model ?? ''}`.trim();
      const os = i.operatingSystem === 'android' ? 'Android' : i.operatingSystem === 'ios' ? 'iOS' : cap(i.operatingSystem);
      return { name: i.name?.trim() || model || 'Cet appareil', model, os: `${os} ${i.osVersion}`.trim() };
    } catch {
      // repli sur le user-agent
    }
  }
  const ua = navigator.userAgent;
  const android = /Android ([\d.]+);\s*([^;)]+?)(?:\s+Build\/|\))/.exec(ua);
  if (android) {
    const model = android[2].startsWith('SM-') ? `Samsung ${android[2]}` : android[2];
    return { name: model, model, os: `Android ${android[1]}` };
  }
  if (/iPhone|iPad/.test(ua)) return { name: 'iPhone', model: 'Apple iPhone', os: 'iOS' };
  return { name: 'Navigateur', model: /Windows/.test(ua) ? 'Ordinateur Windows' : /Mac/.test(ua) ? 'Mac' : 'Ordinateur', os: 'Web' };
}

/** Date de la première ouverture de Payzed sur cet appareil. */
export function deviceSince(): number {
  const KEY = 'payzed_device_since';
  try {
    const v = Number(localStorage.getItem(KEY));
    if (v > 0) return v;
    const now = Date.now();
    localStorage.setItem(KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}
