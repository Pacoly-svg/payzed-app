/*
 * Catalogue Payzed : OPÉRATEURS (identité, logo, provenance) et SERVICES (ce qu'on peut faire).
 *
 * Un opérateur peut proposer plusieurs services dans des catégories différentes
 * (ex. Orange → Orange Money, crédit Orange, Orange Fibre). Les écrans affichent des
 * services ; les logos viennent de l'opérateur (ou du service s'il a sa propre marque).
 *
 * ➜ Nouvel opérateur : une ligne dans OPERATORS (+ logo carré 160×160 dans public/logos/tiles/).
 * ➜ Nouveau service   : une ligne dans SERVICES (operatorId + catégorie).
 * ➜ Nouvelle catégorie : une ligne dans CATEGORIES (l'ordre = ordre d'affichage).
 *
 * Règle logos : uniquement des fichiers officiels de provenance connue (voir `source`).
 * Sans logo officiel vérifiable → `logo` absent : l'app affiche un repère neutre (initiales
 * grises) et l'opérateur est listé dans public/logos/LOGOS.md comme « logo à fournir ».
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

/** Parcours ouvert quand on touche un service de cette catégorie. */
export type ServiceAction = 'transfer' | 'topup' | 'bill' | 'subscription';

export interface Category {
  id: CategoryId;
  label: string;
  /** Regroupement affiché dans « Tous les services ». */
  group: 'Envoyer & recevoir' | 'Recharger' | 'Payer une facture' | 'Abonnements';
  icon: 'Wallet' | 'Landmark' | 'Globe' | 'Smartphone' | 'Zap' | 'Droplets' | 'Wifi' | 'Tv' | 'Car' | 'FileText' | 'ShieldCheck' | 'Repeat';
  action: ServiceAction;
}

/** Provenance d'un logo (traçabilité). */
export type LogoSource =
  | 'projet' // fichier officiel fourni dans le projet d'origine
  | 'simple-icons' // bibliothèque Simple Icons (CC0), marques déposées de leurs propriétaires
  | 'fourni' // fichier officiel fourni par le propriétaire du projet (nov. 2026)
  | 'payzed'; // marque Payzed

export interface Operator {
  id: string;
  name: string;
  logo?: string;
  /** cover : le logo remplit la case (fond de marque) · contain : centré avec marge. */
  fit?: 'cover' | 'contain';
  source?: LogoSource;
}

export interface Service {
  id: string;
  operatorId: string;
  name: string;
  category: CategoryId;
  /** Logo propre au service (sinon celui de l'opérateur). */
  logo?: string;
  fit?: 'cover' | 'contain';
  aliases?: string[];
  /** Factures : libellé du champ référence. */
  refLabel?: string;
}

export const CATEGORIES: Category[] = [
  { id: 'mobile_money', label: 'Mobile Money', group: 'Envoyer & recevoir', icon: 'Wallet', action: 'transfer' },
  { id: 'banks', label: 'Banques', group: 'Envoyer & recevoir', icon: 'Landmark', action: 'transfer' },
  { id: 'transfers', label: "Transferts internationaux", group: 'Envoyer & recevoir', icon: 'Globe', action: 'transfer' },
  { id: 'telecom', label: 'Crédit téléphone', group: 'Recharger', icon: 'Smartphone', action: 'topup' },
  { id: 'electricity', label: 'Électricité', group: 'Payer une facture', icon: 'Zap', action: 'bill' },
  { id: 'water', label: 'Eau', group: 'Payer une facture', icon: 'Droplets', action: 'bill' },
  { id: 'internet', label: 'Internet', group: 'Payer une facture', icon: 'Wifi', action: 'bill' },
  { id: 'tv', label: 'TV', group: 'Payer une facture', icon: 'Tv', action: 'bill' },
  { id: 'transport', label: 'Péage', group: 'Payer une facture', icon: 'Car', action: 'bill' },
  { id: 'taxes', label: 'Impôts', group: 'Payer une facture', icon: 'FileText', action: 'bill' },
  { id: 'insurance', label: 'Assurances', group: 'Payer une facture', icon: 'ShieldCheck', action: 'bill' },
  { id: 'subscriptions', label: 'Abonnements', group: 'Abonnements', icon: 'Repeat', action: 'subscription' },
];

const T = '/logos/tiles';

export const OPERATORS: Operator[] = [
  { id: 'payzed', name: 'Payzed', logo: '/assets/logo/symbole-blanc.svg', source: 'payzed' },
  // Télécoms & Mobile Money
  { id: 'wave', name: 'Wave', logo: `${T}/wave.png`, source: 'projet' },
  { id: 'orange', name: 'Orange', logo: '/logos/orange.svg', source: 'projet' },
  { id: 'yas', name: 'Yas', logo: '/logos/yas.svg', fit: 'contain', source: 'projet' },
  { id: 'expresso', name: 'Expresso', logo: `${T}/expresso.png`, source: 'projet' },
  { id: 'wizall', name: 'Wizall', logo: `${T}/wizall.png`, source: 'fourni' },
  // Banques
  { id: 'cbao', name: 'CBAO', logo: `${T}/cbao.png`, source: 'projet' },
  { id: 'ecobank', name: 'Ecobank', logo: `${T}/ecobank.png`, source: 'projet' },
  { id: 'sgsn', name: 'Société Générale Sénégal', logo: `${T}/sgsn.png`, source: 'fourni' },
  { id: 'uba', name: 'UBA', logo: `${T}/uba.png`, source: 'fourni' },
  { id: 'boa', name: 'Bank of Africa', logo: `${T}/boa.png`, source: 'fourni' },
  // Transferts internationaux
  { id: 'westernunion', name: 'Western Union', logo: `${T}/westernunion.svg`, source: 'simple-icons' },
  { id: 'moneygram', name: 'MoneyGram', logo: `${T}/moneygram.svg`, source: 'simple-icons' },
  { id: 'ria', name: 'Ria', logo: `${T}/ria.png`, source: 'fourni' },
  { id: 'paypal', name: 'PayPal', logo: '/logos/paypal_icon.svg', fit: 'contain', source: 'projet' },
  // Énergie, eau, péage, État, assurance
  { id: 'senelec', name: 'Senelec', logo: `${T}/senelec.png`, source: 'projet' },
  { id: 'seneau', name: "Sen'Eau", logo: `${T}/seneau.png`, source: 'projet' },
  { id: 'secaa', name: 'SECAA (Eiffage)', logo: `${T}/rapido.png`, source: 'projet' },
  { id: 'dgid', name: 'DGID', logo: `${T}/dgid.png`, source: 'projet' },
  { id: 'axa', name: 'AXA', logo: '/logos/axa.svg', source: 'projet' },
  // TV
  { id: 'canalplus', name: 'Canal+', logo: `${T}/canalplus.png`, source: 'fourni' },
  { id: 'startimes', name: 'StarTimes', logo: `${T}/startimes.png`, source: 'fourni' },
  // Abonnements numériques
  { id: 'netflix', name: 'Netflix', logo: '/logos/netflix_icon.svg', source: 'projet' },
  { id: 'spotify', name: 'Spotify', logo: '/logos/spotify.svg', source: 'projet' },
  { id: 'youtube', name: 'YouTube', logo: `${T}/youtube.svg`, source: 'simple-icons' },
  { id: 'deezer', name: 'Deezer', logo: `${T}/deezer.svg`, source: 'simple-icons' },
  { id: 'apple', name: 'Apple', logo: `${T}/applemusic.svg`, source: 'simple-icons' },
  { id: 'openai', name: 'OpenAI', logo: '/logos/chatgpt_icon.svg', source: 'projet' },
  { id: 'anthropic', name: 'Anthropic', logo: '/logos/claude.svg', source: 'projet' },
  { id: 'google', name: 'Google', logo: '/logos/gemini.svg', source: 'projet' },
];

export const SERVICES: Service[] = [
  // Mobile Money
  { id: 'wave', operatorId: 'wave', name: 'Wave', category: 'mobile_money' },
  { id: 'orange_money', operatorId: 'orange', name: 'Orange Money', category: 'mobile_money', logo: `${T}/orange-money.png`, aliases: ['orange money', 'om'] },
  { id: 'mixx', operatorId: 'yas', name: 'Mixx by Yas', category: 'mobile_money', aliases: ['mixx', 'free money'] },
  { id: 'wizall', operatorId: 'wizall', name: 'Wizall Money', category: 'mobile_money', aliases: ['wizall'] },
  // Banques
  { id: 'cbao', operatorId: 'cbao', name: 'CBAO', category: 'banks', aliases: ['attijariwafa'] },
  { id: 'ecobank', operatorId: 'ecobank', name: 'Ecobank', category: 'banks' },
  { id: 'sgsn', operatorId: 'sgsn', name: 'Société Générale', category: 'banks', aliases: ['sgbs', 'societe generale', 'société générale'] },
  { id: 'uba', operatorId: 'uba', name: 'UBA', category: 'banks', aliases: ['united bank for africa'] },
  { id: 'boa', operatorId: 'boa', name: 'Bank of Africa', category: 'banks', aliases: ['bank of africa'] },
  // Transferts internationaux
  { id: 'westernunion', operatorId: 'westernunion', name: 'Western Union', category: 'transfers', aliases: ['western union'] },
  { id: 'moneygram', operatorId: 'moneygram', name: 'MoneyGram', category: 'transfers' },
  { id: 'ria', operatorId: 'ria', name: 'Ria Money Transfer', category: 'transfers', aliases: ['ria money', 'ria'] },
  { id: 'paypal', operatorId: 'paypal', name: 'PayPal', category: 'transfers' },
  // Crédit téléphone
  { id: 'orange', operatorId: 'orange', name: 'Orange', category: 'telecom' },
  { id: 'yas', operatorId: 'yas', name: 'Yas', category: 'telecom', aliases: ['free'] },
  { id: 'expresso', operatorId: 'expresso', name: 'Expresso', category: 'telecom' },
  // Factures
  { id: 'senelec', operatorId: 'senelec', name: 'Senelec', category: 'electricity', refLabel: 'N° de compteur ou de facture' },
  { id: 'woyofal', operatorId: 'senelec', name: 'Woyofal', category: 'electricity', logo: `${T}/woyofal.png`, refLabel: 'N° de compteur' },
  { id: 'seneau', operatorId: 'seneau', name: "Sen'Eau", category: 'water', aliases: ["sen'eau", 'sen eau'], refLabel: 'N° de contrat' },
  { id: 'orange_fibre', operatorId: 'orange', name: 'Orange Fibre', category: 'internet', aliases: ['orange fibre', 'orange box'], refLabel: 'N° client' },
  { id: 'yas_box', operatorId: 'yas', name: 'Yas Box', category: 'internet', aliases: ['yas box', 'yas fibre'], refLabel: 'N° client' },
  { id: 'canalplus', operatorId: 'canalplus', name: 'Canal+', category: 'tv', aliases: ['canal+', 'canal plus'], refLabel: "N° d'abonné ou de décodeur" },
  { id: 'startimes', operatorId: 'startimes', name: 'StarTimes', category: 'tv', aliases: ['star times'], refLabel: 'N° de décodeur (Smartcard)' },
  { id: 'rapido', operatorId: 'secaa', name: 'Rapido', category: 'transport', aliases: ['eiffage', 'autoroute'], refLabel: 'N° de badge' },
  { id: 'dgid', operatorId: 'dgid', name: 'DGID', category: 'taxes', aliases: ['impot', 'impôts'], refLabel: "N° NINEA ou d'avis d'imposition" },
  { id: 'axa', operatorId: 'axa', name: 'AXA', category: 'insurance', refLabel: 'N° de police' },
  // Abonnements
  { id: 'netflix', operatorId: 'netflix', name: 'Netflix', category: 'subscriptions' },
  { id: 'spotify', operatorId: 'spotify', name: 'Spotify', category: 'subscriptions' },
  { id: 'youtube', operatorId: 'youtube', name: 'YouTube Premium', category: 'subscriptions', aliases: ['youtube'] },
  { id: 'deezer', operatorId: 'deezer', name: 'Deezer', category: 'subscriptions' },
  { id: 'applemusic', operatorId: 'apple', name: 'Apple Music', category: 'subscriptions', aliases: ['apple music'] },
  { id: 'chatgpt', operatorId: 'openai', name: 'ChatGPT', category: 'subscriptions', aliases: ['openai'] },
  { id: 'claude', operatorId: 'anthropic', name: 'Claude', category: 'subscriptions', aliases: ['anthropic'] },
  { id: 'gemini', operatorId: 'google', name: 'Gemini', category: 'subscriptions', aliases: ['google'] },
];

/**
 * Commerçants (achats par carte / paiements marchands, utilisés par SIM et l'historique).
 * Ils n'apparaissent pas dans « Paiement » : ce ne sont pas des services à régler depuis l'app.
 */
export interface Merchant {
  id: string;
  name: string;
  /** Libellé d'activité affiché dans l'historique. */
  kind: string;
  logo?: string;
  source?: LogoSource;
  aliases?: string[];
}

export const MERCHANTS: Merchant[] = [
  { id: 'm_auchan', name: 'Auchan', kind: 'Supermarché', logo: `${T}/merchant-auchan.svg`, source: 'simple-icons' },
  { id: 'm_yumyum', name: 'Yum Yum', kind: 'Restauration', aliases: ['yum yum', 'yumyum'] },
  { id: 'm_pathe', name: 'Cinéma Pathé', kind: 'Cinéma', aliases: ['pathe', 'pathé'] },
  { id: 'm_cafederome', name: 'Café de Rome', kind: 'Restaurant', aliases: ['cafe de rome', 'café de rome'] },
  { id: 'm_apple', name: 'Apple', kind: 'High-tech', logo: `${T}/merchant-apple.svg`, source: 'simple-icons', aliases: ['apple store'] },
  { id: 'm_nvidia', name: 'Nvidia', kind: 'High-tech', logo: `${T}/merchant-nvidia.svg`, source: 'simple-icons' },
];

/* ---------- Accès ---------- */

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

export const findOperator = (id: string | undefined) => OPERATORS.find((o) => o.id === id);
export const categoryOf = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;
export const servicesIn = (category: CategoryId) => SERVICES.filter((s) => s.category === category);
export const servicesOf = (operatorId: string) => SERVICES.filter((s) => s.operatorId === operatorId);
export const BILL_CATEGORIES = CATEGORIES.filter((c) => c.action === 'bill');
/** Opérateurs qui proposent au moins un service (vue « Par opérateur »). */
export const SERVICE_OPERATORS = OPERATORS.filter((o) => SERVICES.some((s) => s.operatorId === o.id));

/** Tous les noms reconnus, du plus long au plus court (« orange money » avant « orange »). */
const LOOKUP: [string, Service][] = SERVICES.flatMap((s) => [s.id, s.name, ...(s.aliases ?? [])].map((k) => [norm(k), s] as [string, Service])).sort(
  (a, b) => b[0].length - a[0].length,
);

/** Retrouve un service à partir d'un id ou d'un libellé (« Netflix Premium » → Netflix). */
export function findService(key: string | undefined | null): Service | undefined {
  if (!key) return undefined;
  const k = norm(key);
  return LOOKUP.find(([alias]) => k === alias)?.[1] ?? LOOKUP.find(([alias]) => alias.length >= 3 && k.includes(alias))?.[1];
}

/** Identité visuelle d'un service ou d'un opérateur (logo + nom). */
export function brandOf(key: string): { name: string; logo?: string; fit?: 'cover' | 'contain' } | undefined {
  const service = findService(key);
  if (service) {
    const op = findOperator(service.operatorId);
    return { name: service.name, logo: service.logo ?? op?.logo, fit: service.logo ? service.fit : op?.fit };
  }
  const merchant = findMerchant(key);
  if (merchant) return { name: merchant.name, logo: merchant.logo };
  const op = OPERATORS.find((o) => norm(o.id) === norm(key) || norm(o.name) === norm(key));
  return op ? { name: op.name, logo: op.logo, fit: op.fit } : undefined;
}

/** Retrouve un commerçant par id, nom ou alias. */
export function findMerchant(key: string | undefined | null): Merchant | undefined {
  if (!key) return undefined;
  const k = norm(key);
  return MERCHANTS.find((m) => k === m.id || k === norm(m.name) || (m.aliases ?? []).some((a) => norm(a) === k));
}

export function searchServices(query: string): Service[] {
  const q = norm(query);
  if (!q) return SERVICES;
  return SERVICES.filter(
    (s) =>
      norm(s.name).includes(q) ||
      (s.aliases ?? []).some((a) => norm(a).includes(q)) ||
      norm(findOperator(s.operatorId)?.name ?? '').includes(q) ||
      norm(categoryOf(s.category).label).includes(q),
  );
}
