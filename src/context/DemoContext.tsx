/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useBanking } from './BankingContext';
import { formatCurrency } from '../utils/formatters';
import type { Transaction } from '../types/banking';

/*
 * Mode démo (présentations) : simuler des entrées / sorties d'argent avec
 * notification, et ajuster le solde. Chaque opération créée ici est marquée
 * « simulée » dans son détail.
 */

export const DEMO_PLATFORMS = [
  { id: 'payzed', label: 'Payzed' },
  { id: 'wave', label: 'Wave' },
  { id: 'orange', label: 'Orange Money' },
  { id: 'yas', label: 'Mixx by Yas' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'ecobank', label: 'Ecobank' },
] as const;
export type DemoPlatform = (typeof DEMO_PLATFORMS)[number]['id'];

export interface SimulationConfig {
  direction: 'in' | 'out';
  platform: DemoPlatform;
  name: string;
  phone?: string;
  amount: number;
  delaySeconds: number;
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
      if (!isIn && cfg.amount > balanceRef.current) {
        showToast('Simulation annulée : solde insuffisant');
        return;
      }
      const label = DEMO_PLATFORMS.find((p) => p.id === cfg.platform)?.label ?? 'Payzed';
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
        brandLogo: cfg.platform,
        sender: isIn ? contact : undefined,
        recipient: isIn ? undefined : contact,
        recipientPhone: isIn ? undefined : cfg.phone?.trim() || undefined,
        fee: 0,
        paymentMethod: label,
        isSimulated: true,
      });
      const amountText = formatCurrency(cfg.amount, 'XOF');
      setNotification({
        id: tx.id,
        brand: cfg.platform,
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
    [addTransaction, showToast],
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
    <DemoContext.Provider value={{ notification, dismissNotification, pending, simulate, cancelSimulation }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within a DemoProvider');
  return ctx;
};
