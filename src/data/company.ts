/*
 * Coordonnées et offres Payzed — à modifier ici, en un seul endroit.
 */

/** Service client (appel et WhatsApp). Par défaut : le numéro du fondateur. */
export const SUPPORT = {
  phone: '+221783023514',
  display: '+221 78 302 35 14',
  whatsapp: '221783023514',
};

/** Lien de téléchargement partagé dans les invitations (à remplacer par le lien Play Store à la publication). */
export const INVITE_URL = 'https://github.com/Pacoly-svg/payzed-app/releases';

/** Parrainage : prime versée au parrain et au filleul après la première opération du filleul. */
export const REFERRAL_BONUS = 1000;

/** Payzed Pro : prix mensuel (FCFA). */
export const PRO_PRICE = 2500;

/** Nombre de comptes possibles sur un appareil, selon le plan. */
export const ACCOUNT_LIMIT = { free: 2, pro: 5 } as const;

/** Code de parrainage lisible : prénom (6 lettres max) + 4 derniers chiffres du numéro. */
export function referralCode(name: string, phone: string): string {
  const first = name
    .normalize('NFD')
    .replace(/[^A-Za-z\s]/g, '')
    .trim()
    .split(/\s+/)[0]
    ?.toUpperCase()
    .slice(0, 6);
  const digits = phone.replace(/\D/g, '').slice(-4);
  return `${first || 'PAYZED'}${digits || '2026'}`;
}
