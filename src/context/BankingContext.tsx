import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type {
  CurrencyCode,
  TabType,
  Transaction,
  UserProfile,
  VirtualCardData,
  SubscriptionItem,
  VaultItem,
} from '../types/banking';
import {
  INITIAL_BALANCE,
  INITIAL_USER,
  INITIAL_CARD,
  INITIAL_TRANSACTIONS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_VAULTS,
} from '../data/initialData';
import { formatTransactionDate } from '../utils/formatters';

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  brandLogo?: string;
  amount?: number;
  type?: 'in' | 'out';
  timestamp: number;
}

export type ModalType = 'qr' | 'transfer' | 'subscriptions' | 'bills' | 'topup' | 'newCard' | 'vaults' | null;

type NewTransaction = Omit<Transaction, 'id' | 'timestamp' | 'date' | 'reference' | 'currency'> & {
  currency?: CurrencyCode;
  reference?: string;
  date?: string;
  timestamp?: number;
};

interface BankingContextType {
  // Navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isBalanceHidden: boolean;
  toggleHideBalance: () => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (val: boolean) => void;

  // Notifications in-app
  inAppNotification: InAppNotification | null;
  triggerNotification: (notif: Omit<InAppNotification, 'id' | 'timestamp'>) => void;
  dismissNotification: () => void;

  // Sécurité
  isLocked: boolean;
  isDefaultPin: boolean;
  unlockApp: (enteredPin: string) => boolean;
  lockApp: () => void;
  changePin: (newPin: string) => void;
  isBiometricsEnabled: boolean;
  toggleBiometrics: () => void;
  unlockWithBiometrics: () => void;

  // Compte
  currency: CurrencyCode;
  balance: number;
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;

  // Carte
  card: VirtualCardData;
  toggleFreezeCard: () => void;
  toggleOnlinePayments: () => void;
  toggleContactless: () => void;
  updateSpendingLimit: (limit: number) => void;

  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: NewTransaction) => void;
  toggleArchiveTransaction: (id: string) => void;
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (tx: Transaction | null) => void;

  // Abonnements
  subscriptions: SubscriptionItem[];
  toggleSubscription: (id: string) => void;
  addSubscription: (sub: Omit<SubscriptionItem, 'id'>) => void;

  // Coffres
  vaults: VaultItem[];
  depositToVault: (vaultId: string, amount: number) => void;
  withdrawFromVault: (vaultId: string, amount: number) => void;
  toggleVaultLock: (vaultId: string) => void;
  createVault: (vault: Omit<VaultItem, 'id' | 'currentAmount'>) => void;

  // Fenêtres
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;

  // Messages
  toastMessage: string | null;
  showToast: (msg: string) => void;

  resetToDemoDefaults: () => void;
}

const BankingContext = createContext<BankingContextType | undefined>(undefined);

const PREFIX = 'payzed_';
const DATA_VERSION = 'v11_stable';
const DEFAULT_PIN = '1234';

/* ---------- Stockage local sécurisé (jamais de crash si données corrompues) ---------- */

function load<T>(key: string, fallback: T, validate?: (v: unknown) => boolean): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (validate && !validate(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Stockage plein ou indisponible : l'app continue de fonctionner en mémoire.
  }
}

/** Ancienne version des données → on repart propre une seule fois. */
function migrateStorage() {
  try {
    if (localStorage.getItem(PREFIX + 'data_version') === DATA_VERSION) return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(PREFIX + 'data_version', DATA_VERSION);
  } catch {
    // ignore
  }
}

const isArray = (v: unknown) => Array.isArray(v);
const isObject = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isFiniteNumber = (v: unknown) => typeof v === 'number' && Number.isFinite(v);

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // ignore
  }
}

export const BankingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Migration exécutée une seule fois, avant la lecture des autres états.
  useState(migrateStorage);

  const [activeTab, setActiveTabState] = useState<TabType>('comptes');
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(() => load('hide_balance', false));
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState<string>(() => load('pin', DEFAULT_PIN, (v) => typeof v === 'string' && /^\d{4}$/.test(v)));
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState<boolean>(() => load('biometrics', true));

  const currency: CurrencyCode = 'XOF';
  const [balance, setBalance] = useState<number>(() => load('balance', INITIAL_BALANCE, isFiniteNumber));
  const [user, setUser] = useState<UserProfile>(() => load('user', INITIAL_USER, isObject));
  const [card, setCard] = useState<VirtualCardData>(() => load('card', INITIAL_CARD, isObject));
  const [transactions, setTransactions] = useState<Transaction[]>(() => load('transactions', INITIAL_TRANSACTIONS, isArray));
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() => load('subscriptions', INITIAL_SUBSCRIPTIONS, isArray));
  const [vaults, setVaults] = useState<VaultItem[]>(() => load('vaults', INITIAL_VAULTS, isArray));

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [inAppNotification, setInAppNotification] = useState<InAppNotification | null>(null);

  // Persistance
  useEffect(() => save('hide_balance', isBalanceHidden), [isBalanceHidden]);
  useEffect(() => save('pin', pin), [pin]);
  useEffect(() => save('biometrics', isBiometricsEnabled), [isBiometricsEnabled]);
  useEffect(() => save('balance', balance), [balance]);
  useEffect(() => save('user', user), [user]);
  useEffect(() => save('card', card), [card]);
  useEffect(() => save('transactions', transactions), [transactions]);
  useEffect(() => save('subscriptions', subscriptions), [subscriptions]);
  useEffect(() => save('vaults', vaults), [vaults]);

  // Toast unique (le timer précédent est annulé)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2800);
  }, []);

  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerNotification = useCallback((notif: Omit<InAppNotification, 'id' | 'timestamp'>) => {
    vibrate([60, 40, 60]);
    if (notifTimer.current) clearTimeout(notifTimer.current);
    setInAppNotification({ ...notif, id: `notif_${Date.now()}`, timestamp: Date.now() });
    notifTimer.current = setTimeout(() => setInAppNotification(null), 5000);
  }, []);

  const dismissNotification = useCallback(() => setInAppNotification(null), []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (notifTimer.current) clearTimeout(notifTimer.current);
  }, []);

  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab);
  }, []);

  /* ---------- Sécurité ---------- */

  const unlockApp = useCallback((entered: string) => {
    if (entered === pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, [pin]);

  const unlockWithBiometrics = useCallback(() => setIsLocked(false), []);

  const lockApp = useCallback(() => {
    setActiveModal(null);
    setSelectedTransaction(null);
    setIsLocked(true);
  }, []);

  const changePin = useCallback((newPin: string) => {
    if (/^\d{4}$/.test(newPin)) {
      setPin(newPin);
      showToast('Nouveau code PIN enregistré');
    } else {
      showToast('Le code PIN doit comporter 4 chiffres');
    }
  }, [showToast]);

  const toggleBiometrics = useCallback(() => {
    setIsBiometricsEnabled((prev) => !prev);
  }, []);

  const toggleHideBalance = useCallback(() => setIsBalanceHidden((p) => !p), []);

  /* ---------- Profil & carte ---------- */

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleFreezeCard = useCallback(() => {
    setCard((prev) => ({ ...prev, isFrozen: !prev.isFrozen }));
  }, []);
  const toggleOnlinePayments = useCallback(() => {
    setCard((prev) => ({ ...prev, onlinePaymentsEnabled: !prev.onlinePaymentsEnabled }));
  }, []);
  const toggleContactless = useCallback(() => {
    setCard((prev) => ({ ...prev, contactlessEnabled: !prev.contactlessEnabled }));
  }, []);
  const updateSpendingLimit = useCallback((limit: number) => {
    setCard((prev) => ({ ...prev, spendingLimit: limit }));
  }, []);

  /* ---------- Transactions ---------- */

  /** Enregistre une opération ET met à jour le solde (une seule fois). */
  const addTransaction = useCallback((tx: NewTransaction) => {
    const timestamp = tx.timestamp ?? Date.now();
    const newTx: Transaction = {
      ...tx,
      id: `tx_${timestamp}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp,
      date: tx.date ?? (tx.timestamp ? formatTransactionDate(tx.timestamp) : "À l'instant"),
      reference: tx.reference ?? `PZD-${Math.floor(100000 + Math.random() * 900000)}`,
      currency: tx.currency ?? 'XOF',
    };
    setTransactions((prev) => [newTx, ...prev].sort((a, b) => b.timestamp - a.timestamp));
    setBalance((prev) => prev + tx.amount);
  }, []);

  const toggleArchiveTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, isArchived: !t.isArchived } : t)));
    setSelectedTransaction((prev) => (prev && prev.id === id ? { ...prev, isArchived: !prev.isArchived } : prev));
  }, []);

  /* ---------- Abonnements ---------- */

  const toggleSubscription = useCallback((id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s)),
    );
  }, []);

  const addSubscription = useCallback((sub: Omit<SubscriptionItem, 'id'>) => {
    setSubscriptions((prev) => [{ ...sub, id: `sub_${Date.now()}` }, ...prev]);
  }, []);

  /* ---------- Coffres ---------- */

  const depositToVault = useCallback((vaultId: string, amount: number) => {
    if (!(amount > 0)) return;
    const vault = vaults.find((v) => v.id === vaultId);
    if (!vault) return;
    if (amount > balance) {
      showToast('Solde insuffisant');
      return;
    }
    setVaults((prev) => prev.map((v) => (v.id === vaultId ? { ...v, currentAmount: v.currentAmount + amount } : v)));
    // addTransaction débite le solde : pas de double débit.
    addTransaction({
      title: `Coffre ${vault.name}`,
      subtitle: 'Dépôt vers coffre',
      category: 'Services & Abonnements',
      type: 'transfer_out',
      amount: -amount,
      status: 'completed',
      icon: 'Shield',
      paymentMethod: 'Compte principal',
      fee: 0,
    });
    showToast('Dépôt effectué');
  }, [vaults, balance, addTransaction, showToast]);

  const withdrawFromVault = useCallback((vaultId: string, amount: number) => {
    if (!(amount > 0)) return;
    const vault = vaults.find((v) => v.id === vaultId);
    if (!vault) return;
    if (vault.isLocked) {
      showToast('Ce coffre est verrouillé');
      return;
    }
    if (amount > vault.currentAmount) {
      showToast('Montant supérieur au coffre');
      return;
    }
    setVaults((prev) => prev.map((v) => (v.id === vaultId ? { ...v, currentAmount: v.currentAmount - amount } : v)));
    addTransaction({
      title: `Coffre ${vault.name}`,
      subtitle: 'Retrait vers compte',
      category: 'Revenus & Virements',
      type: 'transfer_in',
      amount,
      status: 'completed',
      icon: 'ArrowDownLeft',
      paymentMethod: 'Coffre Payzed',
      fee: 0,
    });
    showToast('Retrait effectué');
  }, [vaults, addTransaction, showToast]);

  const toggleVaultLock = useCallback((vaultId: string) => {
    setVaults((prev) => prev.map((v) => (v.id === vaultId ? { ...v, isLocked: !v.isLocked } : v)));
  }, []);

  const createVault = useCallback((v: Omit<VaultItem, 'id' | 'currentAmount'>) => {
    setVaults((prev) => [{ ...v, id: `vault_${Date.now()}`, currentAmount: 0 }, ...prev]);
    showToast(`Coffre « ${v.name} » créé`);
  }, [showToast]);

  /* ---------- Réinitialisation ---------- */

  const resetToDemoDefaults = useCallback(() => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(PREFIX + 'data_version', DATA_VERSION);
    } catch {
      // ignore
    }
    setIsBalanceHidden(false);
    setPin(DEFAULT_PIN);
    setIsBiometricsEnabled(true);
    setBalance(INITIAL_BALANCE);
    setUser(INITIAL_USER);
    setCard(INITIAL_CARD);
    setTransactions(INITIAL_TRANSACTIONS);
    setSubscriptions(INITIAL_SUBSCRIPTIONS);
    setVaults(INITIAL_VAULTS);
    setActiveTabState('comptes');
    showToast('Données réinitialisées');
  }, [showToast]);

  return (
    <BankingContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isBalanceHidden,
        toggleHideBalance,
        isOnboardingOpen,
        setIsOnboardingOpen,
        inAppNotification,
        triggerNotification,
        dismissNotification,
        isLocked,
        isDefaultPin: pin === DEFAULT_PIN,
        unlockApp,
        lockApp,
        changePin,
        isBiometricsEnabled,
        toggleBiometrics,
        unlockWithBiometrics,
        currency,
        balance,
        user,
        updateUser,
        card,
        toggleFreezeCard,
        toggleOnlinePayments,
        toggleContactless,
        updateSpendingLimit,
        transactions,
        addTransaction,
        toggleArchiveTransaction,
        selectedTransaction,
        setSelectedTransaction,
        subscriptions,
        toggleSubscription,
        addSubscription,
        vaults,
        depositToVault,
        withdrawFromVault,
        toggleVaultLock,
        createVault,
        activeModal,
        setActiveModal,
        toastMessage,
        showToast,
        resetToDemoDefaults,
      }}
    >
      {children}
    </BankingContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBanking = () => {
  const context = useContext(BankingContext);
  if (!context) throw new Error('useBanking must be used within a BankingProvider');
  return context;
};
