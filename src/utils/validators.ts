/** Validations communes des formulaires financiers (Sénégal par défaut, extensible). */

const digits = (v: string) => v.replace(/\D/g, '');

/** Numéro mobile sénégalais : 9 chiffres commençant par 7 (70, 71, 75, 76, 77, 78), avec ou sans +221. */
export function isSnMobile(v: string): boolean {
  let d = digits(v);
  if (d.startsWith('00221')) d = d.slice(5);
  else if (d.startsWith('221') && d.length === 12) d = d.slice(3);
  return /^7[0-8]\d{7}$/.test(d);
}

/** « 771234567 » → « +221 77 123 45 67 » (laisse tel quel si non reconnu). */
export function formatSnPhone(v: string): string {
  let d = digits(v);
  if (d.startsWith('00221')) d = d.slice(5);
  else if (d.startsWith('221') && d.length === 12) d = d.slice(3);
  const m = /^(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(d);
  return m ? `+221 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : v.trim();
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const isIntlPhone = (v: string) => /^\+?\d{8,15}$/.test(v.replace(/[\s.-]/g, ''));
export const isName = (v: string) => v.trim().length >= 2;
/** RIB / IBAN : au moins 10 caractères alphanumériques. */
export const isAccount = (v: string) => v.replace(/\s/g, '').length >= 10 && /^[a-z0-9\s]+$/i.test(v);
