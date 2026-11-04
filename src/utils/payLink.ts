/** Liens de paiement Payzed (QR code et liens profonds Android `payzed://pay?...`). */

export interface Payee {
  name: string;
  phone: string;
}

/** Lien profond : scanné avec l'appareil photo du téléphone, il ouvre directement Payzed. */
export const encodePayload = (name: string, phone: string) =>
  `payzed://pay?name=${encodeURIComponent(name)}&tel=${encodeURIComponent(phone.replace(/\s/g, ''))}`;

export function decodePayload(raw: string): Payee | null {
  const text = raw.trim();
  if (/^payzed:\/\/pay\?/i.test(text)) {
    try {
      const q = new URL(text.replace(/^payzed:\/\//i, 'https://payzed.local/')).searchParams;
      const tel = (q.get('tel') ?? '').replace(/[^\d+]/g, '');
      if (/^\+?\d{9,15}$/.test(tel)) return { name: (q.get('name') ?? '').trim() || 'Contact Payzed', phone: tel };
    } catch {
      return null;
    }
    return null;
  }
  const m = /^PAYZED:([^:]*):(\+?\d{6,15})$/i.exec(text);
  if (m) {
    let name = m[1];
    try {
      name = decodeURIComponent(m[1]);
    } catch {
      // garder tel quel
    }
    return { name: name.replace(/^@/, '') || 'Contact Payzed', phone: m[2] };
  }
  const digits = text.replace(/[^\d+]/g, '');
  if (/^\+?\d{9,15}$/.test(digits)) return { name: 'Contact', phone: digits };
  return null;
}

