export type CurrencyCode = 'XOF' | 'EUR' | 'USD' | 'GBP';

export interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  exchangeRateToEUR: number; // For simulation conversions
  decimals: number;
  countryName: string;
  flagIcon: string;
}

export type TabType = 'comptes' | 'statistiques' | 'cartes' | 'parametres';

export type TransactionType = 'transfer_out' | 'transfer_in' | 'withdrawal' | 'deposit' | 'subscription' | 'bill' | 'topup' | 'salary' | 'pos' | 'card_payment';

export type TransactionCategory = 
  | 'Alimentation & Restaurants'
  | 'Logement & Factures'
  | 'Services & Abonnements'
  | 'Loisirs & Shopping'
  | 'Transport & Mobilité'
  | 'Revenus & Virements'
  | 'Télécom & Données'
  | 'Alimentation'
  | 'Virements'
  | 'Supermarché'
  | 'Abonnements'
  | 'Logement'
  | 'Télécom';

export interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  category: TransactionCategory;
  type: TransactionType;
  amount: number; // positive for income, negative for expense
  currency: CurrencyCode;
  date: string; // ISO string or human string
  timestamp: number;
  status: TransactionStatus;
  icon: string;
  brandLogo?: string;
  recipient?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  sender?: string;
  reference: string;
  fee: number;
  paymentMethod: string;
  location?: string;
  locationCity?: string;
  locationCoords?: { lat: number; lng: number };
  isArchived?: boolean;
  /** Code de retrait chez un agent. */
  code?: string;
  /** Opération créée depuis le mode test SIM — jamais un mouvement réel. */
  isSimulated?: boolean;
  /** Échéancier d'une opération SIM (statut recalculé à partir de ces horodatages). */
  sim?: SimSchedule;
}

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface SimSchedule {
  createdAt: number;
  /** Passage de « En attente » à « En cours de traitement ». */
  processingAt: number;
  /** Fin du traitement : application du résultat. */
  resolveAt: number;
  outcome: 'completed' | 'failed';
  /** Résultat appliqué (solde ajusté) : ne sera plus jamais rejoué. */
  settled: boolean;
  /** Montant déjà débité à la création (sorties), remboursé en cas d'échec ou d'annulation. */
  held: number;
}

export interface UserProfile {
  name: string;
  tag: string;
  phone: string;
  email: string;
  avatarUrl: string;
  isVerified: boolean;
  tier: 'Standard' | 'Premium Black' | 'Infinite' | 'Compte Principal';
  countryCode: 'CI' | 'SN' | 'FR' | 'US' | 'GB';
  iban: string;
  bic: string;
  /** Formule du compte (Réglages › Plan). */
  plan?: 'free' | 'pro';
  /** Compte personnel ou professionnel (plusieurs comptes sur l'appareil). */
  accountType?: 'personal' | 'business';
}

export interface VirtualCardData {
  id: string;
  cardholderName: string;
  maskedNumber: string;
  fullNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  isFrozen: boolean;
  onlinePaymentsEnabled: boolean;
  contactlessEnabled: boolean;
  atmWithdrawalsEnabled: boolean;
  internationalEnabled?: boolean;
  spendingLimit: number;
  currentMonthSpent: number;
  cardBrand: 'visa' | 'mastercard';
  cardLevel: 'BLACK INFINITE' | 'PLATINUM' | 'METAL WORLD ELITE' | 'BUSINESS';
}

export interface SubscriptionItem {
  id: string;
  name: string;
  provider: string;
  amount: number;
  currency: CurrencyCode;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  category: string;
  status: 'active' | 'paused';
  iconName: string;
}

export interface VaultItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  emoji: string;
  isLocked: boolean;
  color: string;
}
