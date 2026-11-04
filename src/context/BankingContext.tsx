import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  CurrencyCode, 
  TabType, 
  Transaction, 
  UserProfile, 
  VirtualCardData, 
  SubscriptionItem,
  VaultItem
} from '../types/banking';
import { 
  INITIAL_USER, 
  INITIAL_CARD, 
  INITIAL_TRANSACTIONS, 
  INITIAL_SUBSCRIPTIONS,
  INITIAL_VAULTS
} from '../data/initialData';
import { convertCurrency, formatTransactionDate } from '../utils/formatters';

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  brandLogo?: string;
  amount?: number;
  type?: 'in' | 'out';
  timestamp: number;
}

interface BankingContextType {
  // Navigation & Display
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isBalanceHidden: boolean;
  toggleHideBalance: () => void;
  isPhoneMockup: boolean;
  setIsPhoneMockup: (val: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (val: boolean) => void;

  // Theming (Dark Mode)
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // In-App Notification System & Simulation
  inAppNotification: InAppNotification | null;
  triggerNotification: (notif: Omit<InAppNotification, 'id' | 'timestamp'>) => void;
  dismissNotification: () => void;
  isNotifSoundEnabled: boolean;
  toggleNotifSound: () => void;
  playNotificationSound: () => void;
  requestNotificationPermission: () => Promise<boolean>;
  scheduleSimulation: (config: {
    type: 'in' | 'out';
    platform: string;
    personName: string;
    amount: number;
    delaySeconds: number;
    recipientPhone?: string;
    recipientEmail?: string;
    customTimestamp?: number;
    customDate?: string;
  }) => void;
  scheduledCountdown: number | null;

  // Security & 4-Digit PIN Lock
  isLocked: boolean;
  pin: string;
  unlockApp: (enteredPin: string) => boolean;
  lockApp: () => void;
  changePin: (newPin: string) => void;
  isBiometricsEnabled: boolean;
  toggleBiometrics: () => void;
  unlockWithBiometrics: () => boolean;

  // Currency & Balance
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  balance: number;
  setBalance: (amount: number) => void;

  // User Profile
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;

  // Virtual Card
  card: VirtualCardData;
  updateCard: (updates: Partial<VirtualCardData>) => void;
  toggleFreezeCard: () => void;
  toggleOnlinePayments: () => void;
  toggleContactless: () => void;
  updateSpendingLimit: (limit: number) => void;

  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp' | 'date' | 'reference'> & { reference?: string; date?: string; brandLogo?: string; timestamp?: number }) => void;
  toggleArchiveTransaction: (id: string) => void;
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (tx: Transaction | null) => void;

  // Subscriptions
  subscriptions: SubscriptionItem[];
  toggleSubscription: (id: string) => void;
  addSubscription: (sub: Omit<SubscriptionItem, 'id'>) => void;

  // Coffres / Vaults Épargne
  vaults: VaultItem[];
  depositToVault: (vaultId: string, amount: number) => void;
  withdrawFromVault: (vaultId: string, amount: number) => void;
  toggleVaultLock: (vaultId: string) => void;
  createVault: (vault: Omit<VaultItem, 'id' | 'currentAmount'>) => void;

  // Canaux de transfert personnalisés
  customPlatforms: { id: string; name: string; logoUrl: string }[];
  addCustomPlatform: (platform: { name: string; logoUrl: string }) => void;
  removeCustomPlatform: (id: string) => void;

  // Interactive Modals
  activeModal: 'qr' | 'transfer' | 'subscriptions' | 'bills' | 'topup' | 'newCard' | 'vaults' | null;
  setActiveModal: (modal: 'qr' | 'transfer' | 'subscriptions' | 'bills' | 'topup' | 'newCard' | 'vaults' | null) => void;

  // Feedback Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Demo Reset
  resetToDemoDefaults: () => void;
}

const BankingContext = createContext<BankingContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BALANCE: 'payzed_balance',
  CURRENCY: 'payzed_currency',
  HIDE_BALANCE: 'payzed_hide_balance',
  CARD: 'payzed_card',
  TRANSACTIONS: 'payzed_transactions',
  USER: 'payzed_user',
  SUBSCRIPTIONS: 'payzed_subscriptions',
  VAULTS: 'payzed_vaults',
  CUSTOM_PLATFORMS: 'payzed_custom_platforms',
  PHONE_MOCKUP: 'payzed_phone_mockup',
  ONBOARDING_SEEN: 'payzed_onboarding_seen',
  SECURITY_PIN: 'payzed_security_pin',
  DARK_MODE: 'payzed_dark_mode',
  VERSION: 'payzed_data_version',
};

const CURRENT_VERSION = 'v10_vaults_receipt_haptics';

function playBankChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // Ignore audio restriction errors
  }
}

export const BankingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ensure document is always clean light mode
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem(STORAGE_KEYS.DARK_MODE);
  }

  const isOutdated = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEYS.VERSION) !== CURRENT_VERSION;
  if (isOutdated) {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTIONS);
    localStorage.removeItem(STORAGE_KEYS.CURRENCY);
    localStorage.removeItem(STORAGE_KEYS.BALANCE);
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
  }

  // Pure Light Mode (Always False)
  const isDarkMode = false;
  const toggleDarkMode = () => {};

  // Security Lock State - Initial open requires PIN
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [pin, setPinState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.SECURITY_PIN) || '1234';
  });

  // In-App Notification System
  const [inAppNotification, setInAppNotification] = useState<InAppNotification | null>(null);
  const [scheduledCountdown, setScheduledCountdown] = useState<number | null>(null);

  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    if (isOutdated) return 'XOF';
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENCY);
    return (saved as CurrencyCode) || 'XOF';
  });

  const [balance, setBalanceState] = useState<number>(() => {
    if (isOutdated) return 3250000;
    const saved = localStorage.getItem(STORAGE_KEYS.BALANCE);
    return saved ? Number(saved) : 3250000;
  });

  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.HIDE_BALANCE) === 'true';
  });

  const [activeTab, setActiveTab] = useState<TabType>('comptes');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  const [isPhoneMockup, setIsPhoneMockup] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PHONE_MOCKUP);
    return saved !== null ? saved === 'true' : true;
  });

  const [user, setUser] = useState<UserProfile>(() => {
    if (isOutdated) return INITIAL_USER;
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [card, setCard] = useState<VirtualCardData>(() => {
    if (isOutdated) return INITIAL_CARD;
    const saved = localStorage.getItem(STORAGE_KEYS.CARD);
    return saved ? JSON.parse(saved) : INITIAL_CARD;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (isOutdated) return INITIAL_TRANSACTIONS;
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() => {
    if (isOutdated) return INITIAL_SUBSCRIPTIONS;
    const saved = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTIONS;
  });

  const [vaults, setVaults] = useState<VaultItem[]>(() => {
    if (isOutdated) return INITIAL_VAULTS;
    const saved = localStorage.getItem(STORAGE_KEYS.VAULTS);
    return saved ? JSON.parse(saved) : INITIAL_VAULTS;
  });

  // Canaux de transfert personnalisés par l'utilisateur
  const [customPlatforms, setCustomPlatforms] = useState<{ id: string; name: string; logoUrl: string }[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_PLATFORMS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PLATFORMS, JSON.stringify(customPlatforms));
  }, [customPlatforms]);

  const addCustomPlatform = ({ name, logoUrl }: { name: string; logoUrl: string }) => {
    const newPlatform = {
      id: `plat_${Date.now()}`,
      name: name.trim(),
      logoUrl: logoUrl.trim(),
    };
    setCustomPlatforms(prev => [...prev, newPlatform]);
    showToast(`Canal « ${name.trim()} » ajouté`);
  };

  const removeCustomPlatform = (id: string) => {
    setCustomPlatforms(prev => prev.filter(p => p.id !== id));
    showToast('Canal supprimé');
  };

  const [activeModal, setActiveModal] = useState<'qr' | 'transfer' | 'subscriptions' | 'bills' | 'topup' | 'newCard' | 'vaults' | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BALANCE, balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HIDE_BALANCE, isBalanceHidden.toString());
  }, [isBalanceHidden]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CARD, JSON.stringify(card));
  }, [card]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VAULTS, JSON.stringify(vaults));
  }, [vaults]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PHONE_MOCKUP, isPhoneMockup.toString());
  }, [isPhoneMockup]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SECURITY_PIN, pin);
  }, [pin]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const [isNotifSoundEnabled, setIsNotifSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('payzed_notif_sound_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleNotifSound = () => {
    setIsNotifSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('payzed_notif_sound_enabled', JSON.stringify(next));
      if (next) playBankChime();
      showToast(next ? 'Son des notifications activé' : 'Notifications en mode silencieux');
      return next;
    });
  };

  const playNotificationSound = () => {
    playBankChime();
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Notifications système non prises en charge par ce navigateur');
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showToast('Notifications système autorisées avec succès');
        return true;
      } else {
        showToast('Autorisation des notifications refusée');
        return false;
      }
    } catch {
      return false;
    }
  };

  const triggerNotification = (notif: Omit<InAppNotification, 'id' | 'timestamp'>) => {
    if (isNotifSoundEnabled) {
      playBankChime();
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 75, 150]);
      } catch {
        // Ignore
      }
    }
    const newNotif: InAppNotification = {
      ...notif,
      id: `notif_${Date.now()}`,
      timestamp: Date.now(),
    };
    setInAppNotification(newNotif);

    // Try system OS notification if permitted
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(newNotif.title, {
            body: newNotif.message,
            icon: '/android-chrome-192x192.png',
            badge: '/android-chrome-192x192.png',
            tag: newNotif.id,
          });
        }
      }
    } catch {
      // Ignore
    }

    // Auto dismiss after 6s
    setTimeout(() => {
      setInAppNotification((curr) => (curr?.id === newNotif.id ? null : curr));
    }, 6000);
  };

  const dismissNotification = () => {
    setInAppNotification(null);
  };

  const scheduleSimulation = (config: {
    type: 'in' | 'out';
    platform: string;
    personName: string;
    amount: number;
    delaySeconds: number;
    recipientPhone?: string;
    recipientEmail?: string;
    customTimestamp?: number;
    customDate?: string;
  }) => {
    const isCredit = config.type === 'in';
    const finalAmount = isCredit ? Math.abs(config.amount) : -Math.abs(config.amount);
    const platformName = config.platform;
    const person = config.personName || (isCredit ? 'Babacar Sy' : 'Fatou Sow');

    const customMatch = customPlatforms.find(p => p.name.toLowerCase() === platformName.toLowerCase());
    const brandKey = customMatch 
      ? customMatch.logoUrl 
      : platformName.toLowerCase().includes('wave')
      ? 'wave'
      : platformName.toLowerCase().includes('orange')
      ? 'orange'
      : platformName.toLowerCase().includes('paypal')
      ? 'paypal'
      : platformName.toLowerCase().includes('ecobank')
      ? 'ecobank'
      : platformName.toLowerCase().includes('sgbs')
      ? 'sgbs'
      : 'wave';

    if (config.delaySeconds <= 0) {
      // Immediate execution: Direct delivery, zero intrusive toast over notification!
      addTransaction({
        title: person,
        subtitle: `${isCredit ? 'Virement reçu' : 'Transfert émis'} • ${platformName}`,
        category: 'Revenus & Virements',
        type: isCredit ? 'transfer_in' : 'transfer_out',
        amount: finalAmount,
        currency,
        status: 'completed',
        icon: isCredit ? 'ArrowDownLeft' : 'ArrowUpRight',
        brandLogo: brandKey,
        sender: isCredit ? `${person} (${platformName})` : undefined,
        recipient: !isCredit ? (config.recipientPhone ? `${person} (${config.recipientPhone})` : `${person} (${platformName})`) : undefined,
        recipientPhone: config.recipientPhone,
        recipientEmail: config.recipientEmail,
        fee: 0,
        paymentMethod: platformName,
        timestamp: config.customTimestamp,
        date: config.customDate,
      });

      triggerNotification({
        title: isCredit ? `Virement reçu (+${config.amount.toLocaleString()} ${currency})` : `Paiement émis (-${config.amount.toLocaleString()} ${currency})`,
        message: isCredit 
          ? `${person} vous a envoyé ${config.amount.toLocaleString()} ${currency} via ${platformName}.` 
          : `Règlement de ${config.amount.toLocaleString()} ${currency} effectué à ${person} via ${platformName}.`,
        brandLogo: brandKey,
        amount: finalAmount,
        type: config.type,
      });
      return;
    }

    // Delayed execution
    showToast(`Simulation planifiée dans ${config.delaySeconds}s (${person} • ${config.amount.toLocaleString()} ${currency})`);
    setScheduledCountdown(config.delaySeconds);

    let currentSec = config.delaySeconds;
    const interval = setInterval(() => {
      currentSec -= 1;
      if (currentSec <= 0) {
        clearInterval(interval);
        setScheduledCountdown(null);

        addTransaction({
          title: person,
          subtitle: `${isCredit ? 'Virement reçu' : 'Transfert émis'} • ${platformName}`,
          category: 'Revenus & Virements',
          type: isCredit ? 'transfer_in' : 'transfer_out',
          amount: finalAmount,
          currency,
          status: 'completed',
          icon: isCredit ? 'ArrowDownLeft' : 'ArrowUpRight',
          brandLogo: brandKey,
          sender: isCredit ? `${person} (${platformName})` : undefined,
          recipient: !isCredit ? (config.recipientPhone ? `${person} (${config.recipientPhone})` : `${person} (${platformName})`) : undefined,
          recipientPhone: config.recipientPhone,
          recipientEmail: config.recipientEmail,
          fee: 0,
          paymentMethod: platformName,
          timestamp: config.customTimestamp,
          date: config.customDate,
        });

        triggerNotification({
          title: isCredit ? `Virement reçu (+${config.amount.toLocaleString()} ${currency})` : `Paiement émis (-${config.amount.toLocaleString()} ${currency})`,
          message: isCredit 
            ? `${person} vous a envoyé ${config.amount.toLocaleString()} ${currency} via ${platformName}.` 
            : `Règlement de ${config.amount.toLocaleString()} ${currency} effectué à ${person} via ${platformName}.`,
          brandLogo: brandKey,
          amount: finalAmount,
          type: config.type,
        });
      } else {
        setScheduledCountdown(currentSec);
      }
    }, 1000);
  };

  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('payzed_biometrics_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleBiometrics = () => {
    setIsBiometricsEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('payzed_biometrics_enabled', JSON.stringify(next));
      showToast(next ? 'Face ID & Empreinte activés' : 'Biométrie désactivée');
      return next;
    });
  };

  const unlockWithBiometrics = (): boolean => {
    setIsLocked(false);
    playBankChime();
    showToast('Authentification biométrique réussie');
    return true;
  };

  const unlockApp = (enteredPin: string): boolean => {
    if (enteredPin === pin) {
      setIsLocked(false);
      showToast('Session sécurisée ouverte');
      return true;
    }
    return false;
  };

  const lockApp = () => {
    setIsLocked(true);
    showToast('Application verrouillée');
  };

  const changePin = (newPin: string) => {
    if (newPin.length === 4 && /^\d{4}$/.test(newPin)) {
      setPinState(newPin);
      showToast('Nouveau code PIN enregistré avec succès');
    } else {
      showToast('Erreur : le code PIN doit comporter 4 chiffres');
    }
  };

  const toggleHideBalance = () => {
    setIsBalanceHidden((prev) => !prev);
  };

  const setCurrency = (newCurrency: CurrencyCode) => {
    if (newCurrency === currency) return;
    const oldCurrency = currency;
    const convertedBalance = convertCurrency(balance, oldCurrency, newCurrency);
    setCurrencyState(newCurrency);
    setBalanceState(convertedBalance);

    // Conversion automatique de toutes les transactions enregistrées
    setTransactions((prev) =>
      prev.map((tx) => ({
        ...tx,
        amount: convertCurrency(tx.amount, oldCurrency, newCurrency),
        currency: newCurrency,
      }))
    );

    // Conversion des montants d'abonnements récurrents
    setSubscriptions((prev) =>
      prev.map((sub) => ({
        ...sub,
        amount: convertCurrency(sub.amount, oldCurrency, newCurrency),
        currency: newCurrency,
      }))
    );

    showToast(`Devise convertie : ${newCurrency}`);
  };

  const setBalance = (newAmount: number) => {
    setBalanceState(newAmount);
    showToast('Solde mis à jour avec succès');
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
    showToast('Profil mis à jour');
  };

  const updateCard = (updates: Partial<VirtualCardData>) => {
    setCard((prev) => ({ ...prev, ...updates }));
  };

  const toggleFreezeCard = () => {
    setCard((prev) => {
      const nextState = !prev.isFrozen;
      showToast(nextState ? 'Carte verrouillée par sécurité' : 'Carte déverrouillée et active');
      return { ...prev, isFrozen: nextState };
    });
  };

  const toggleOnlinePayments = () => {
    setCard((prev) => {
      const nextState = !prev.onlinePaymentsEnabled;
      showToast(nextState ? 'Paiements en ligne activés' : 'Paiements en ligne désactivés');
      return { ...prev, onlinePaymentsEnabled: nextState };
    });
  };

  const toggleContactless = () => {
    setCard((prev) => {
      const nextState = !prev.contactlessEnabled;
      showToast(nextState ? 'Paiement sans-contact activé' : 'Sans-contact désactivé');
      return { ...prev, contactlessEnabled: nextState };
    });
  };

  const updateSpendingLimit = (limit: number) => {
    setCard((prev) => ({ ...prev, spendingLimit: limit }));
    showToast('Plafond mensuel ajusté');
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'timestamp' | 'date' | 'reference'> & { reference?: string; date?: string; brandLogo?: string; timestamp?: number }) => {
    const timestamp = tx.timestamp || Date.now();
    const newTx: Transaction = {
      ...tx,
      id: `tx_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp,
      date: tx.date || (tx.timestamp ? formatTransactionDate(tx.timestamp) : "À l'instant"),
      reference: tx.reference || `PAYZ-TX-${Math.floor(100000 + Math.random() * 900000)}`,
      currency,
    };

    setTransactions((prev) => [newTx, ...prev].sort((a, b) => b.timestamp - a.timestamp));
    setBalanceState((prev) => prev + tx.amount);
    showToast(`Transaction enregistrée : ${tx.amount > 0 ? '+' : ''}${tx.amount.toLocaleString()} ${currency}`);
  };

  const toggleArchiveTransaction = (id: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === id) {
          const nextArchived = !tx.isArchived;
          showToast(nextArchived ? 'Transaction masquée et archivée' : 'Transaction désarchivée');
          return { ...tx, isArchived: nextArchived };
        }
        return tx;
      })
    );
    setSelectedTransaction((prev) => {
      if (prev && prev.id === id) {
        return { ...prev, isArchived: !prev.isArchived };
      }
      return prev;
    });
  };

  const toggleSubscription = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.id === id) {
          const nextStatus = sub.status === 'active' ? 'paused' : 'active';
          showToast(`Abonnement ${sub.name} : ${nextStatus === 'active' ? 'Actif' : 'Suspendu'}`);
          return { ...sub, status: nextStatus };
        }
        return sub;
      })
    );
  };

  const addSubscription = (sub: Omit<SubscriptionItem, 'id'>) => {
    const newSub: SubscriptionItem = {
      ...sub,
      id: `sub_${Date.now()}`,
    };
    setSubscriptions((prev) => [newSub, ...prev]);
    showToast(`Abonnement ${sub.name} ajouté`);
  };

  const depositToVault = (vaultId: string, amount: number) => {
    if (amount <= 0) return;
    if (amount > balance) {
      showToast('Solde disponible insuffisant');
      return;
    }
    const targetVault = vaults.find(v => v.id === vaultId);
    if (!targetVault) return;

    setBalanceState(prev => prev - amount);
    setVaults(prev => prev.map(v => v.id === vaultId ? { ...v, currentAmount: v.currentAmount + amount } : v));
    
    addTransaction({
      title: `Dépôt Coffre • ${targetVault.name}`,
      subtitle: `Épargne sécurisée vers ${targetVault.emoji} ${targetVault.name}`,
      category: 'Services & Abonnements',
      type: 'transfer_out',
      amount: -amount,
      currency,
      status: 'completed',
      icon: 'Shield',
      paymentMethod: 'Compte Principal Payzed',
      fee: 0,
    });

    showToast(`${amount.toLocaleString()} ${currency} déposés dans le coffre`);
  };

  const withdrawFromVault = (vaultId: string, amount: number) => {
    if (amount <= 0) return;
    const targetVault = vaults.find(v => v.id === vaultId);
    if (!targetVault) return;
    if (targetVault.isLocked) {
      showToast('Ce coffre est verrouillé. Déverrouillez-le d\'abord.');
      return;
    }
    if (amount > targetVault.currentAmount) {
      showToast('Fonds insuffisants dans le coffre');
      return;
    }

    setVaults(prev => prev.map(v => v.id === vaultId ? { ...v, currentAmount: v.currentAmount - amount } : v));
    setBalanceState(prev => prev + amount);

    addTransaction({
      title: `Retrait Coffre • ${targetVault.name}`,
      subtitle: `Récupération de fonds vers le compte courant`,
      category: 'Revenus & Virements',
      type: 'transfer_in',
      amount: amount,
      currency,
      status: 'completed',
      icon: 'ArrowDownLeft',
      paymentMethod: 'Coffre Épargne Payzed',
      fee: 0,
    });

    showToast(`${amount.toLocaleString()} ${currency} récupérés sur votre compte`);
  };

  const toggleVaultLock = (vaultId: string) => {
    setVaults(prev => prev.map(v => {
      if (v.id === vaultId) {
        const nextLock = !v.isLocked;
        showToast(`Coffre ${v.name} : ${nextLock ? 'Verrouillé' : 'Déverrouillé'}`);
        return { ...v, isLocked: nextLock };
      }
      return v;
    }));
  };

  const createVault = (v: Omit<VaultItem, 'id' | 'currentAmount'>) => {
    const newVault: VaultItem = {
      ...v,
      id: `vault_${Date.now()}`,
      currentAmount: 0,
    };
    setVaults(prev => [newVault, ...prev]);
    showToast(`Nouveau coffre « ${v.name} » créé`);
  };

  const resetToDemoDefaults = () => {
    setCurrencyState('XOF');
    setBalanceState(3250000);
    setIsBalanceHidden(false);
    setUser(INITIAL_USER);
    setCard(INITIAL_CARD);
    setTransactions(INITIAL_TRANSACTIONS);
    setSubscriptions(INITIAL_SUBSCRIPTIONS);
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    showToast('Données réinitialisées (3 250 000 FCFA - Sénégal)');
  };

  return (
    <BankingContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isBalanceHidden,
        toggleHideBalance,
        isPhoneMockup,
        setIsPhoneMockup,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isDarkMode,
        toggleDarkMode,
        inAppNotification,
        triggerNotification,
        dismissNotification,
        isNotifSoundEnabled,
        toggleNotifSound,
        playNotificationSound,
        requestNotificationPermission,
        scheduleSimulation,
        scheduledCountdown,
        isLocked,
        pin,
        unlockApp,
        lockApp,
        changePin,
        isBiometricsEnabled,
        toggleBiometrics,
        unlockWithBiometrics,
        currency,
        setCurrency,
        balance,
        setBalance,
        user,
        updateUser,
        card,
        updateCard,
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
        customPlatforms,
        addCustomPlatform,
        removeCustomPlatform,
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

export const useBanking = () => {
  const context = useContext(BankingContext);
  if (!context) {
    throw new Error('useBanking must be used within a BankingProvider');
  }
  return context;
};
