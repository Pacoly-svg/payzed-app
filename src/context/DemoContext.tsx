/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useBanking } from './BankingContext';
import { formatCurrency } from '../utils/formatters';
import type { Transaction } from '../types/banking';
import { feeFor } from '../utils/fees';
import { findProvider, type CategoryId } from '../data/catalog';

/*
 * Mode démo (présentations) : simuler des entrées / sorties d'argent avec
 * notification, et ajuster le solde. Chaque opération créée ici est marquée
 * « simulée » dans son détail.
 */

/** Familles de canaux proposées dans SIM (issues du catalogue). */
export const SIM_CATEGORIES: CategoryId[] = ['mobile_money', 'banks', 'transfers'];

export interface CustomPlatform {
  id: string;
  name: string;
  /** Logo en data URL (image choisie dans la galerie). */
  logo: string;
}

const CUSTOM_KEY = 'payzed_custom_platforms';
const loadCustom = (): CustomPlatform[] => {
  try {
    const v = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');
    return Array.isArray(v) ? v.filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string') : [];
  } catch {
    return [];
  }
};

export interface SimulationConfig {
  direction: 'in' | 'out';
  /** Canal officiel (wave, orange…) ou id d'un canal personnalisé. */
  platform: string;
  name: string;
  phone?: string;
  amount: number;
  delaySeconds: number;
  /** Date de l'opération (par défaut : maintenant). */
  timestamp?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  brand: string;
  tx: Transaction;
}

interface DemoContextType {
  notification: AppNotification | null;
  dismissNotification: () => void;
  pending: { endsAt: number; label: string } | null;
  simulate: (cfg: SimulationConfig) => void;
  cancelSimulation: () => void;
  customPlatforms: CustomPlatform[];
  addCustomPlatform: (name: string, logo: string) => string;
  removeCustomPlatform: (id: string) => void;
  platformLabel: (id: string) => string;
  platformLogo: (id: string) => string;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

/* ---------- Son de notification (Web Audio, aucun fichier) ---------- */

let audioCtx: AudioContext | null = null;
function primeAudio() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx ??= new Ctx();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
  } catch {
    // ignore
  }
}
function chime() {
  try {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.25, t + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.35);
      osc.connect(gain).connect(audioCtx!.destination);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.4);
    });
  } catch {
    // ignore
  }
}

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addTransaction, balance, showToast } = useBanking();
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [pending, setPending] = useState<{ endsAt: number; label: string } | null>(null);
  const simTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [customPlatforms, setCustomPlatforms] = useState<CustomPlatform[]>(loadCustom);
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(customPlatforms));
    } catch {
      // stockage plein : on garde en mémoire
    }
  }, [customPlatforms]);
  const customRef = useRef(customPlatforms);
  useEffect(() => {
    customRef.current = customPlatforms;
  }, [customPlatforms]);

  const platformLabel = useCallback(
    (id: string) =>
      id === 'payzed' ? 'Payzed' : customRef.current.find((p) => p.id === id)?.name ?? findProvider(id)?.name ?? 'Payzed',
    [],
  );
  const platformLogo = useCallback((id: string) => customRef.current.find((p) => p.id === id)?.logo ?? id, []);

  const addCustomPlatform = useCallback((name: string, logo: string) => {
    const id = `custom_${Date.now()}`;
    setCustomPlatforms((prev) => [...prev, { id, name: name.trim(), logo }]);
    customRef.current = [...customRef.current, { id, name: name.trim(), logo }];
    return id;
  }, []);
  const removeCustomPlatform = useCallback((id: string) => {
    setCustomPlatforms((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const balanceRef = useRef(balance);
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  useEffect(
    () => () => {
      if (simTimer.current) clearTimeout(simTimer.current);
      if (notifTimer.current) clearTimeout(notifTimer.current);
    },
    [],
  );

  const dismissNotification = useCallback(() => setNotification(null), []);

  const fire = useCallback(
    (cfg: SimulationConfig) => {
      setPending(null);
      const isIn = cfg.direction === 'in';
      const fee = isIn ? 0 : feeFor(cfg.amount);
      if (!isIn && cfg.amount + fee > balanceRef.current) {
        showToast('SIM annulée : solde insuffisant (frais compris)');
        return;
      }
      const label = platformLabel(cfg.platform);
      const logo = platformLogo(cfg.platform);
      const who = cfg.name.trim();
      const contact = cfg.phone?.trim() ? `${who} · ${cfg.phone.trim()}` : who;
      const tx = addTransaction({
        title: who,
        subtitle: isIn ? `Reçu via ${label}` : `Envoyé via ${label}`,
        category: 'Revenus & Virements',
        type: isIn ? 'transfer_in' : 'transfer_out',
        amount: isIn ? cfg.amount : -cfg.amount,
        status: 'completed',
        icon: isIn ? 'ArrowDownLeft' : 'ArrowUpRight',
        brandLogo: logo,
        sender: isIn ? contact : undefined,
        recipient: isIn ? undefined : contact,
        recipientPhone: isIn ? undefined : cfg.phone?.trim() || undefined,
        fee,
        paymentMethod: label,
        isSimulated: true,
        timestamp: cfg.timestamp,
      });
      // Opération datée dans le passé : ajoutée à l'historique, sans notification
      if (cfg.timestamp && Date.now() - cfg.timestamp > 60_000) {
        showToast("Opération ajoutée à l'historique");
        return;
      }
      const amountText = formatCurrency(cfg.amount, 'XOF');
      setNotification({
        id: tx.id,
        brand: logo,
        tx,
        title: isIn ? `+${amountText} reçus` : `-${amountText} envoyés`,
        message: isIn ? `${who} vous a envoyé ${amountText} via ${label}.` : `Paiement de ${amountText} à ${who} via ${label}.`,
      });
      chime();
      try {
        navigator.vibrate?.([80, 60, 80]);
      } catch {
        // ignore
      }
      if (notifTimer.current) clearTimeout(notifTimer.current);
      notifTimer.current = setTimeout(() => setNotification(null), 6000);
    },
    [addTransaction, showToast, platformLabel, platformLogo],
  );

  const simulate = useCallback(
    (cfg: SimulationConfig) => {
      primeAudio(); // le son doit être « débloqué » pendant le toucher de l'utilisateur
      if (simTimer.current) clearTimeout(simTimer.current);
      if (cfg.delaySeconds <= 0) {
        fire(cfg);
        return;
      }
      setPending({
        endsAt: Date.now() + cfg.delaySeconds * 1000,
        label: `${cfg.direction === 'in' ? 'Entrée' : 'Sortie'} de ${formatCurrency(cfg.amount, 'XOF')}`,
      });
      simTimer.current = setTimeout(() => fire(cfg), cfg.delaySeconds * 1000);
    },
    [fire],
  );

  const cancelSimulation = useCallback(() => {
    if (simTimer.current) clearTimeout(simTimer.current);
    setPending(null);
  }, []);

  return (
    <DemoContext.Provider
      value={{
        notification,
        dismissNotification,
        pending,
        simulate,
        cancelSimulation,
        customPlatforms,
        addCustomPlatform,
        removeCustomPlatform,
        platformLabel,
        platformLogo,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within a DemoProvider');
  return ctx;
};
