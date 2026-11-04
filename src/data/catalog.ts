/*
 * Catalogue des opérateurs et services Payzed.
 *
 * ➜ Ajouter un service : une ligne dans PROVIDERS (id unique, nom, catégorie, logo).
 * ➜ Ajouter une catégorie : une ligne dans CATEGORIES (l'ordre = ordre d'affichage).
 * ➜ Logo : déposer un carré 160×160 (PNG ou SVG) dans public/logos/tiles/ puis
 *   renseigner `logo`. Sans logo officiel, renseigner `mono` + `bg` (monogramme).
 *
 * Tous les écrans (Envoyer, Crédit, Factures, Abonnements, SIM, « Tous les services »)
 * et toutes les icônes (BrandLogo) lisent ce fichier : rien d'autre à modifier.
 */

export type CategoryId =
  | 'mobile_money'
  | 'banks'
  | 'transfers'
  | 'telecom'
  | 'electricity'
  | 'water'
  | 'internet'
  | 'tv'
  | 'transport'
  | 'taxes'
  | 'insurance'
  | 'subscriptions';

/** Ce que fait l'app quand on touche un service de cette catégorie. */
export type ProviderAction = 'transfer' | 'topup' | 'bill' | 'subscription';

export interface Category {
  id: CategoryId;
  label: string;
  /** Nom d'icône lucide (voir CategoryIcon). */
  icon: 'Wallet' | 'Landmark' | 'Globe' | 'Smartphone' | 'Zap' | 'Droplets' | 'Wifi' | 'Tv' | 'Car' | 'FileText' | 'ShieldCheck' | 'Repeat';
  action: ProviderAction;
}

export interface Provider {
  id: string;
  name: string;
  category: CategoryId;
  /** Carré 160×160 dans /public. */
  logo?: string;
  /** Le logo occupe tout le carré (cover) ou est centré avec marge (contain). */
  fit?: 'cover' | 'contain';
  /** Monogramme si aucun logo officiel n'est disponible. */
  mono?: string;
  bg?: string;
  fg?: string;
  /** Autres noms reconnus (minuscules) pour retrouver le logo à partir d'un libellé. */
  aliases?: string[];
  /** Factures : libellé du champ référence. */
  refLabel?: string;
}

export const CATEGORIES: Category[] = [
  { id: 'mobile_money', label: 'Mobile Money', icon: 'Wallet', action: 'transfer' },
  { id: 'banks', label: 'Banques', icon: 'Landmark', action: 'transfer' },
  { id: 'transfers', label: "Transferts d'argent", icon: 'Globe', action: 'transfer' },
  { id: 'telecom', label: 'Crédit & télécoms', icon: 'Smartphone', action: 'topup' },
  { id: 'electricity', label: 'Électricité', icon: 'Zap', action: 'bill' },
  { id: 'water', label: 'Eau', icon: 'Droplets', action: 'bill' },
  { id: 'internet', label: 'Internet', icon: 'Wifi', action: 'bill' },
  { id: 'tv', label: 'TV', icon: 'Tv', action: 'bill' },
  { id: 'transport', label: 'Transport & péage', icon: 'Car', action: 'bill' },
  { id: 'taxes', label: 'Impôts & taxes', icon: 'FileText', action: 'bill' },
  { id: 'insurance', label: 'Assurances', icon: 'ShieldCheck', action: 'bill' },
  { id: 'subscriptions', label: 'Abonnements', icon: 'Repeat', action: 'subscription' },
];

export const PROVIDERS: Provider[] = [
  // Mobile Money
  { id: 'wave', name: 'Wave', category: 'mobile_money', logo: '/logos/tiles/wave.png' },
  { id: 'orange_money', name: 'Orange Money', category: 'mobile_money', logo: '/logos/orange.svg', aliases: ['orange money', 'om'] },
  { id: 'mixx', name: 'Mixx by Yas', category: 'mobile_money', logo: '/logos/yas.svg', fit: 'contain', aliases: ['mixx', 'free money'] },
  { id: 'wizall', name: 'Wizall', category: 'mobile_money', mono: 'Wz', bg: '#0A4DA2', aliases: ['wizall money'] },

  // Banques
  { id: 'cbao', name: 'CBAO', category: 'banks', logo: '/logos/tiles/cbao.png', aliases: ['attijariwafa'] },
  { id: 'ecobank', name: 'Ecobank', category: 'banks', logo: '/logos/tiles/ecobank.png' },
  { id: 'sgbs', name: 'Société Générale', category: 'banks', logo: '/logos/tiles/sgbs.svg', aliases: ['societe generale', 'société générale', 'sgsn'] },
  { id: 'uba', name: 'UBA', category: 'banks', mono: 'UBA', bg: '#D42E12', aliases: ['united bank for africa'] },
  { id: 'boa', name: 'Bank of Africa', category: 'banks', mono: 'BOA', bg: '#00843D', aliases: ['bank of africa'] },

  // Transferts d'argent
  { id: 'westernunion', name: 'Western Union', category: 'transfers', logo: '/logos/tiles/westernunion.svg', aliases: ['western union'] },
  { id: 'moneygram', name: 'MoneyGram', category: 'transfers', logo: '/logos/tiles/moneygram.svg' },
  { id: 'ria', name: 'Ria', category: 'transfers', mono: 'Ria', bg: '#F26522', aliases: ['ria money'] },
  { id: 'paypal', name: 'PayPal', category: 'transfers', logo: '/logos/paypal_icon.svg', fit: 'contain' },

  // Crédit & télécoms
  { id: 'orange', name: 'Orange', category: 'telecom', logo: '/logos/orange.svg' },
  { id: 'yas', name: 'Yas', category: 'telecom', logo: '/logos/yas.svg', fit: 'contain', aliases: ['free'] },
  { id: 'expresso', name: 'Expresso', category: 'telecom', logo: '/logos/tiles/expresso.png' },

  // Électricité
  { id: 'senelec', name: 'Senelec', category: 'electricity', logo: '/logos/tiles/senelec.png', refLabel: 'N° de compteur ou de facture' },
  { id: 'woyofal', name: 'Woyofal', category: 'electricity', logo: '/logos/tiles/woyofal.png', refLabel: 'N° de compteur' },

  // Eau
  { id: 'seneau', name: "Sen'Eau", category: 'water', logo: '/logos/tiles/seneau.png', aliases: ["sen'eau", 'sen eau'], refLabel: 'N° de contrat' },

  // Internet
  { id: 'orange_fibre', name: 'Orange Fibre', category: 'internet', logo: '/logos/orange.svg', aliases: ['orange fibre', 'orange box'], refLabel: 'N° client' },
  { id: 'yas_box', name: 'Yas Box', category: 'internet', logo: '/logos/yas.svg', fit: 'contain', aliases: ['yas box', 'yas fibre'], refLabel: 'N° client' },

  // TV
  { id: 'canalplus', name: 'Canal+', category: 'tv', mono: 'C+', bg: '#000000', aliases: ['canal+', 'canal plus', 'canal'], refLabel: "N° d'abonné ou de décodeur" },
  { id: 'startimes', name: 'StarTimes', category: 'tv', mono: 'ST', bg: '#E4002B', aliases: ['star times'], refLabel: 'N° de décodeur (Smartcard)' },

  // Transport & péage
  { id: 'rapido', name: 'Rapido', category: 'transport', logo: '/logos/tiles/rapido.png', aliases: ['eiffage', 'autoroute'], refLabel: 'N° de badge' },

  // Impôts & taxes
  { id: 'dgid', name: 'DGID', category: 'taxes', logo: '/logos/tiles/dgid.png', aliases: ['impot', 'impôts'], refLabel: "N° NINEA ou d'avis d'imposition" },

  // Assurances
  { id: 'axa', name: 'AXA', category: 'insurance', logo: '/logos/axa.svg', refLabel: 'N° de police' },

  // Abonnements
  { id: 'netflix', name: 'Netflix', category: 'subscriptions', logo: '/logos/netflix_icon.svg' },
  { id: 'spotify', name: 'Spotify', category: 'subscriptions', logo: '/logos/spotify.svg' },
  { id: 'youtube', name: 'YouTube Premium', category: 'subscriptions', logo: '/logos/tiles/youtube.svg', aliases: ['youtube'] },
  { id: 'deezer', name: 'Deezer', category: 'subscriptions', logo: '/logos/tiles/deezer.svg' },
  { id: 'applemusic', name: 'Apple Music', category: 'subscriptions', logo: '/logos/tiles/applemusic.svg', aliases: ['apple music'] },
  { id: 'chatgpt', name: 'ChatGPT', category: 'subscriptions', logo: '/logos/chatgpt_icon.svg', aliases: ['openai'] },
  { id: 'claude', name: 'Claude', category: 'subscriptions', logo: '/logos/claude.svg', aliases: ['anthropic'] },
  { id: 'gemini', name: 'Gemini', category: 'subscriptions', logo: '/logos/gemini.svg', aliases: ['google'] },
];

/* ---------- Recherche ---------- */

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

/** Tous les noms reconnus, du plus long au plus court (« orange money » avant « orange »). */
const LOOKUP: [string, Provider][] = PROVIDERS.flatMap((p) =>
  [p.id, p.name, ...(p.aliases ?? [])].map((k) => [norm(k), p] as [string, Provider]),
).sort((a, b) => b[0].length - a[0].length);

/** Retrouve un service à partir d'un id ou d'un libellé (« Netflix Premium » → Netflix). */
export function findProvider(key: string | undefined | null): Provider | undefined {
  if (!key) return undefined;
  const k = norm(key);
  return LOOKUP.find(([alias]) => k === alias)?.[1] ?? LOOKUP.find(([alias]) => alias.length >= 3 && k.includes(alias))?.[1];
}

export const providersIn = (category: CategoryId) => PROVIDERS.filter((p) => p.category === category);
export const categoryOf = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;
export const BILL_CATEGORIES = CATEGORIES.filter((c) => c.action === 'bill');

export function searchProviders(query: string): Provider[] {
  const q = norm(query);
  if (!q) return PROVIDERS;
  return PROVIDERS.filter(
    (p) =>
      norm(p.name).includes(q) ||
      (p.aliases ?? []).some((a) => norm(a).includes(q)) ||
      norm(categoryOf(p.category).label).includes(q),
  );
}
