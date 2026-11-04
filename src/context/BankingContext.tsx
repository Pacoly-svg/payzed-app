import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import { sha256 } from '../utils/sha256';
import { newCardDetails } from '../utils/card';

export type ModalType = 'qr' | 'scan' | 'services' | 'withdraw' | 'transfer' | 'subscriptions' | 'bills' | 'topup' | 'vaults' | 'settings' | null;

/** Compte enregistré sur l'appareil (Réglages › Comptes). */
export interface AccountSummary {
  id: string;
  name: string;
  phone: string;
  type: 'personal' | 'business';
  createdAt: number;
}

export interface ModalParams {
  /** Id d'un service du catalogue (ex. « senelec », « wave »). */
  provider?: string;
  /** Bénéficiaire connu (lien profond payzed://pay?name=…&tel=…). */
  payee?: { name: string; phone: string };
}

type NewTransaction = Omit<Transaction, 'id' | 'timestamp' | 'date' | 'reference' | 'currency'> & {
  currency?: CurrencyCode;
  /** Ne pas toucher au solde maintenant (ex. entrée SIM encore en attente). */
  skipBalance?: boolean;
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
  /** Historique entièrement masqué (œil de l'historique). */
  isHistoryHidden: boolean;
  toggleHistoryHidden: () => void;

  // Sécurité
  isLocked: boolean;
  unlockApp: (enteredPin: string) => boolean;
  /** Vérifie le code PIN sans changer l'état (accès au mode test). */
  verifyPin: (enteredPin: string) => boolean;
  /** Mode test : donne accès aux simulations SIM (protégé par le code PIN). */
  testMode: boolean;
  setTestMode: (on: boolean) => void;
  lockApp: () => void;
  changePin: (newPin: string) => void;
  isBiometricsEnabled: boolean;
  toggleBiometrics: () => void;
  unlockWithBiometrics: () => void;

  // Compte
  currency: CurrencyCode;
  balance: number;
  /** Mode démo : fixer le solde à une valeur précise. */
  setBalanceTo: (amount: number) => void;
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;

  // Carte
  card: VirtualCardData;
  toggleFreezeCard: () => void;
  toggleOnlinePayments: () => void;
  toggleContactless: () => void;
  toggleAtmWithdrawals: () => void;
  toggleInternational: () => void;
  /** Carte perdue / volée : l'ancienne est détruite, une nouvelle est émise. */
  replaceCard: () => void;
  updateSpendingLimit: (limit: number) => void;

  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: NewTransaction) => Transaction;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  removeTransactions: (ids: string[]) => void;
  /** Ajustement de solde lié au règlement d'une opération (moteur SIM). */
  adjustBalance: (delta: number) => void;
  toggleArchiveTransaction: (id: string) => void;
  /** Masquer / réafficher plusieurs opérations dans l'historique. */
  setArchived: (ids: string[], archived: boolean) => void;
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (tx: Transaction | null) => void;

  // Abonnements
  subscriptions: SubscriptionItem[];
  toggleSubscription: (id: string) => void;
  addSubscription: (sub: Omit<SubscriptionItem, 'id'>) => void;
  removeSubscription: (id: string) => void;

  // Coffres
  vaults: VaultItem[];
  depositToVault: (vaultId: string, amount: number) => void;
  withdrawFromVault: (vaultId: string, amount: number) => void;
  toggleVaultLock: (vaultId: string) => void;
  createVault: (vault: Omit<VaultItem, 'id' | 'currentAmount'>) => void;
  deleteVault: (vaultId: string) => void;

  // Fenêtres
  activeModal: ModalType;
  /** Ouvre une fenêtre, éventuellement avec un service présélectionné (catalogue). */
  setActiveModal: (modal: ModalType, params?: ModalParams) => void;
  modalParams: ModalParams;

  // Messages
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Comptes (plusieurs comptes sur l'appareil, chacun avec ses données)
  accounts: AccountSummary[];
  activeAccountId: string;
  /** Crée un compte (solde 0, carte neuve, historique vide) puis bascule dessus. */
  addAccount: (data: { name: string; phone: string; type: 'personal' | 'business' }) => void;
  switchAccount: (id: string) => void;
  /** Retire un compte inactif de l'appareil (ses données sont supprimées). */
  removeAccount: (id: string) => void;

  resetToDemoDefaults: () => void;
}

const BankingContext = createContext<BankingContextType | undefined>(undefined);

const PREFIX = 'payzed_';
const DATA_VERSION = 'v12_history';
const DEFAULT_PIN = '1234';
/** Données propres à chaque compte ; le reste (code PIN, préférences, SIM) est commun à l'appareil. */
const ACCOUNT_KEYS = ['balance', 'user', 'card', 'transactions', 'subscriptions', 'vaults'] as const;
const MAIN_ACCOUNT = 'acct_main';
/** Bascule de compte : l'app redémarre déjà déverrouillée, avec un message d'accueil. */
const RESUME_KEY = 'payzed_resume';
/** Pendant une bascule, plus aucune écriture (les données du compte suivant sont déjà en place). */
let storageFrozen = false;
/** Le code PIN n'est jamais stocké en clair : seule son empreinte SHA-256 l'est. */
const hashPin = (pin: string) => sha256(`payzed-pin:${pin}`);

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
  if (storageFrozen) return;
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

export const BankingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Migration exécutée une seule fois, avant la lecture des autres états.
  useState(migrateStorage);

  const [activeTab, setActiveTabState] = useState<TabType>('comptes');
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(() => load('hide_balance', false));
  const [isHistoryHidden, setIsHistoryHidden] = useState<boolean>(() => load('hide_history', false));

  // Après une bascule de compte : déjà déverrouillé (le code a été saisi avant la bascule)
  const [resumeMessage] = useState<string | null>(() => {
    try {
      const msg = sessionStorage.getItem(RESUME_KEY);
      sessionStorage.removeItem(RESUME_KEY);
      return msg;
    } catch {
      return null;
    }
  });
  const [isLocked, setIsLocked] = useState(() => resumeMessage === null);
  const [pinHash, setPinHash] = useState<string>(() => {
    // Migration : ancien code stocké en clair → empreinte, puis suppression
    const legacy = load<string | null>('pin', null, (v) => typeof v === 'string' && /^\d{4}$/.test(v));
    if (legacy) {
      try {
        localStorage.removeItem(PREFIX + 'pin');
      } catch {
        // ignore
      }
      return hashPin(legacy);
    }
    return load('pin_hash', hashPin(DEFAULT_PIN), (v) => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v));
  });
  const [testMode, setTestMode] = useState<boolean>(() => load('test_mode', false));
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState<boolean>(() => load('biometrics', true));

  const currency: CurrencyCode = 'XOF';
  const [balance, setBalance] = useState<number>(() => load('balance', INITIAL_BALANCE, isFiniteNumber));
  const [user, setUser] = useState<UserProfile>(() => load('user', INITIAL_USER, isObject));
  const [card, setCard] = useState<VirtualCardData>(() => load('card', INITIAL_CARD, isObject));
  const [transactions, setTransactions] = useState<Transaction[]>(() => load('transactions', INITIAL_TRANSACTIONS, isArray));
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() => load('subscriptions', INITIAL_SUBSCRIPTIONS, isArray));
  const [vaults, setVaults] = useState<VaultItem[]>(() => load('vaults', INITIAL_VAULTS, isArray));
  const [activeAccountId] = useState<string>(() => load('active_account', MAIN_ACCOUNT, (v) => typeof v === 'string'));
  const [storedAccounts, setAccounts] = useState<AccountSummary[]>(() => {
    const saved = load<AccountSummary[]>('accounts', [], isArray);
    return saved.length ? saved : [{ id: activeAccountId, name: user.name, phone: user.phone, type: user.accountType ?? 'personal', createdAt: Date.now() }];
  });

  const [activeModal, setActiveModalState] = useState<ModalType>(null);
  const [modalParams, setModalParams] = useState<ModalParams>({});
  const setActiveModal = useCallback((modal: ModalType, params?: ModalParams) => {
    setModalParams(params ?? {});
    setActiveModalState(modal);
  }, []);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persistance
  useEffect(() => save('hide_balance', isBalanceHidden), [isBalanceHidden]);
  useEffect(() => save('hide_history', isHistoryHidden), [isHistoryHidden]);
  useEffect(() => save('pin_hash', pinHash), [pinHash]);
  useEffect(() => save('test_mode', testMode), [testMode]);
  useEffect(() => save('biometrics', isBiometricsEnabled), [isBiometricsEnabled]);
  useEffect(() => save('balance', balance), [balance]);
  useEffect(() => save('user', user), [user]);
  useEffect(() => save('card', card), [card]);
  useEffect(() => save('transactions', transactions), [transactions]);
  useEffect(() => save('subscriptions', subscriptions), [subscriptions]);
  useEffect(() => save('vaults', vaults), [vaults]);
  // Le nom et le numéro du compte actif suivent le profil
  const accounts = useMemo(
    () => storedAccounts.map((a) => (a.id === activeAccountId ? { ...a, name: user.name, phone: user.phone } : a)),
    [storedAccounts, activeAccountId, user.name, user.phone],
  );
  useEffect(() => save('accounts', accounts), [accounts]);
  useEffect(() => save('active_account', activeAccountId), [activeAccountId]);

  // Toast unique (le timer précédent est annulé)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2800);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab);
  }, []);

  /* ---------- Sécurité ---------- */

  const unlockApp = useCallback((entered: string) => {
    if (hashPin(entered) === pinHash) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, [pinHash]);

  const verifyPin = useCallback((entered: string) => hashPin(entered) === pinHash, [pinHash]);

  const unlockWithBiometrics = useCallback(() => setIsLocked(false), []);

  const lockApp = useCallback(() => {
    setActiveModal(null);
    setSelectedTransaction(null);
    setIsLocked(true);
  }, [setActiveModal]);

  const changePin = useCallback((newPin: string) => {
    if (/^\d{4}$/.test(newPin)) {
      setPinHash(hashPin(newPin));
      showToast('Nouveau code PIN enregistré');
    } else {
      showToast('Le code PIN doit comporter 4 chiffres');
    }
  }, [showToast]);

  const toggleBiometrics = useCallback(() => {
    setIsBiometricsEnabled((prev) => !prev);
  }, []);

  const toggleHideBalance = useCallback(() => setIsBalanceHidden((p) => !p), []);
  const toggleHistoryHidden = useCallback(() => setIsHistoryHidden((p) => !p), []);

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
  const toggleAtmWithdrawals = useCallback(() => {
    setCard((prev) => ({ ...prev, atmWithdrawalsEnabled: !prev.atmWithdrawalsEnabled }));
  }, []);
  const toggleInternational = useCallback(() => {
    setCard((prev) => ({ ...prev, internationalEnabled: !(prev.internationalEnabled ?? true) }));
  }, []);
  const replaceCard = useCallback(() => {
    setCard((prev) => ({ ...prev, ...newCardDetails(), isFrozen: false }));
  }, []);
  const updateSpendingLimit = useCallback((limit: number) => {
    setCard((prev) => ({ ...prev, spendingLimit: limit }));
  }, []);

  /* ---------- Transactions ---------- */

  /** Enregistre une opération ET met à jour le solde (une seule fois). */
  const addTransaction = useCallback((tx: NewTransaction) => {
    const timestamp = tx.timestamp ?? Date.now();
    const { skipBalance, ...data } = tx;
    const newTx: Transaction = {
      ...data,
      id: `tx_${timestamp}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp,
      date: tx.date ?? (tx.timestamp ? formatTransactionDate(tx.timestamp) : "À l'instant"),
      reference: tx.reference ?? `PZD-${Math.floor(100000 + Math.random() * 900000)}`,
      currency: tx.currency ?? 'XOF',
    };
    setTransactions((prev) => [newTx, ...prev].sort((a, b) => b.timestamp - a.timestamp));
    // Débit = montant + frais (les frais ne s'appliquent qu'aux sorties)
    if (!skipBalance) setBalance((prev) => prev + tx.amount - (tx.amount < 0 ? tx.fee || 0 : 0));
    return newTx;
  }, []);

  const setArchived = useCallback((ids: string[], archived: boolean) => {
    const set = new Set(ids);
    setTransactions((prev) => prev.map((t) => (set.has(t.id) ? { ...t, isArchived: archived } : t)));
  }, []);

  const updateTransaction = useCallback((id: string, patch: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    setSelectedTransaction((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  }, []);

  const removeTransactions = useCallback((ids: string[]) => {
    const set = new Set(ids);
    setTransactions((prev) => prev.filter((t) => !set.has(t.id)));
    setSelectedTransaction((prev) => (prev && set.has(prev.id) ? null : prev));
  }, []);

  const adjustBalance = useCallback((delta: number) => {
    if (Number.isFinite(delta) && delta !== 0) setBalance((prev) => Math.round(prev + delta));
  }, []);

  const setBalanceTo = useCallback((amount: number) => {
    if (Number.isFinite(amount) && amount >= 0) setBalance(Math.round(amount));
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

  const removeSubscription = useCallback((id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
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

  const deleteVault = useCallback((vaultId: string) => {
    const vault = vaults.find((v) => v.id === vaultId);
    if (!vault) return;
    setVaults((prev) => prev.filter((v) => v.id !== vaultId));
    if (vault.currentAmount > 0) {
      addTransaction({
        title: `Coffre ${vault.name}`,
        subtitle: 'Coffre fermé, fonds récupérés',
        category: 'Revenus & Virements',
        type: 'transfer_in',
        amount: vault.currentAmount,
        status: 'completed',
        icon: 'ArrowDownLeft',
        paymentMethod: 'Coffre Payzed',
        fee: 0,
      });
    }
    showToast('Coffre supprimé');
  }, [vaults, addTransaction, showToast]);

  /* ---------- Comptes ---------- */

  /** Range les données du compte actif, installe celles du compte `id`, puis redémarre l'app. */
  const activate = useCallback(
    (id: string, next: Record<string, string> | null, welcome: string, list: AccountSummary[] = accounts) => {
      try {
        storageFrozen = true;
        const snapshot: Record<string, string> = {};
        ACCOUNT_KEYS.forEach((k) => {
          snapshot[k] = JSON.stringify({ balance, user, card, transactions, subscriptions, vaults }[k]);
        });
        localStorage.setItem(`${PREFIX}acct_${activeAccountId}`, JSON.stringify(snapshot));
        const stored = next ?? (JSON.parse(localStorage.getItem(`${PREFIX}acct_${id}`) ?? 'null') as Record<string, string> | null);
        if (!stored) throw new Error('compte introuvable');
        ACCOUNT_KEYS.forEach((k) => {
          if (stored[k] != null) localStorage.setItem(PREFIX + k, stored[k]);
          else localStorage.removeItem(PREFIX + k);
        });
        localStorage.removeItem(`${PREFIX}acct_${id}`);
        localStorage.setItem(`${PREFIX}accounts`, JSON.stringify(list));
        localStorage.setItem(`${PREFIX}active_account`, JSON.stringify(id));
        sessionStorage.setItem(RESUME_KEY, welcome);
        window.location.reload();
      } catch {
        storageFrozen = false;
        showToast('Impossible de changer de compte');
      }
    },
    [balance, user, card, transactions, subscriptions, vaults, activeAccountId, accounts, showToast],
  );

  const switchAccount = useCallback(
    (id: string) => {
      const target = accounts.find((a) => a.id === id);
      if (!target || id === activeAccountId) return;
      activate(id, null, `Compte ${target.name}`);
    },
    [accounts, activeAccountId, activate],
  );

  const addAccount = useCallback(
    ({ name, phone, type }: { name: string; phone: string; type: 'personal' | 'business' }) => {
      const id = `acct_${Date.now()}`;
      const holder = name.toUpperCase();
      const newUser: UserProfile = {
        ...INITIAL_USER,
        name,
        phone,
        tag: `@${name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')}`,
        avatarUrl: '',
        tier: 'Standard',
        plan: 'free',
        accountType: type,
      };
      const newCard: VirtualCardData = {
        ...INITIAL_CARD,
        ...newCardDetails(),
        cardholderName: holder,
        currentMonthSpent: 0,
        spendingLimit: 2_000_000,
        cardLevel: type === 'business' ? 'BUSINESS' : INITIAL_CARD.cardLevel,
      };
      const data: Record<string, string> = {
        balance: JSON.stringify(0),
        user: JSON.stringify(newUser),
        card: JSON.stringify(newCard),
        transactions: JSON.stringify([]),
        subscriptions: JSON.stringify([]),
        vaults: JSON.stringify([]),
      };
      activate(id, data, `Compte ${name} créé`, [...accounts, { id, name, phone, type, createdAt: Date.now() }]);
    },
    [accounts, activate],
  );

  const removeAccount = useCallback(
    (id: string) => {
      if (id === activeAccountId) return;
      try {
        localStorage.removeItem(`${PREFIX}acct_${id}`);
      } catch {
        // ignore
      }
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      showToast('Compte retiré de cet appareil');
    },
    [activeAccountId, showToast],
  );

  // Message après une bascule de compte
  useEffect(() => {
    if (resumeMessage) showToast(resumeMessage);
  }, [resumeMessage, showToast]);

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
    setPinHash(hashPin(DEFAULT_PIN));
    setTestMode(false);
    setIsBiometricsEnabled(true);
    setBalance(INITIAL_BALANCE);
    setUser(INITIAL_USER);
    setCard(INITIAL_CARD);
    setTransactions(INITIAL_TRANSACTIONS);
    setSubscriptions(INITIAL_SUBSCRIPTIONS);
    setVaults(INITIAL_VAULTS);
    setAccounts([{ id: activeAccountId, name: INITIAL_USER.name, phone: INITIAL_USER.phone, type: 'personal', createdAt: Date.now() }]);
    setActiveTabState('comptes');
    showToast('Données réinitialisées');
  }, [showToast, activeAccountId]);

  return (
    <BankingContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isBalanceHidden,
        toggleHideBalance,
        isHistoryHidden,
        toggleHistoryHidden,
        isLocked,
        unlockApp,
        verifyPin,
        testMode,
        setTestMode,
        lockApp,
        changePin,
        isBiometricsEnabled,
        toggleBiometrics,
        unlockWithBiometrics,
        currency,
        balance,
        setBalanceTo,
        user,
        updateUser,
        card,
        toggleFreezeCard,
        toggleOnlinePayments,
        toggleContactless,
        toggleAtmWithdrawals,
        toggleInternational,
        replaceCard,
        updateSpendingLimit,
        transactions,
        addTransaction,
        updateTransaction,
        removeTransactions,
        adjustBalance,
        toggleArchiveTransaction,
        setArchived,
        selectedTransaction,
        setSelectedTransaction,
        subscriptions,
        toggleSubscription,
        addSubscription,
        removeSubscription,
        vaults,
        depositToVault,
        withdrawFromVault,
        toggleVaultLock,
        createVault,
        deleteVault,
        activeModal,
        setActiveModal,
        modalParams,
        toastMessage,
        showToast,
        accounts,
        activeAccountId,
        addAccount,
        switchAccount,
        removeAccount,
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
