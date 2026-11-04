/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useBanking } from './BankingContext';
import { formatCurrency } from '../utils/formatters';
import { feeFor } from '../utils/fees';
import { findService, type CategoryId } from '../data/catalog';
import type { SimSchedule, Transaction, TransactionStatus } from '../types/banking';

/*
 * Moteur SIM (mode test) — simulation d'opérations, JAMAIS de mouvement réel.
 *
 * Chaque opération SIM porte un échéancier persisté (`tx.sim`) :
 *   création ─▶ En attente ─(processingAt)─▶ En cours ─(resolveAt)─▶ Réussie | Échouée
 *                                       └── Annulée (à tout moment avant la fin)
 * Le statut est RECALCULÉ à partir de ces horodatages (au démarrage, au retour au
 * premier plan, puis chaque seconde) : un redémarrage de l'app ne perd rien et
 * aucun résultat n'est appliqué deux fois (`settled`).
 *
 * Effets sur le solde (cohérents avec un vrai portefeuille) :
 *  - sortie / retrait : montant + frais débités dès la création, remboursés si échec/annulation ;
 *  - entrée : créditée uniquement quand l'opération réussit.
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

export type SimKind = 'in' | 'out' | 'withdrawal';

export interface SimulationConfig {
  kind: SimKind;
  /** Canal officiel (wave, orange_money…) ou id d'un canal personnalisé. */
  platform: string;
  name: string;
  phone?: string;
  amount: number;
  /** Durée de traitement avant le résultat (0 = immédiat). */
  delayMs: number;
  outcome: 'completed' | 'failed';
  /** Date passée : l'opération est ajoutée directement à l'historique. */
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
  /** Lance une simulation. Renvoie un message d'erreur, ou null si elle a démarré. */
  simulate: (cfg: SimulationConfig) => string | null;
  cancelSim: (txId: string) => void;
  /** Opérations SIM non terminées (en attente / en cours). */
  activeSims: Transaction[];
  /** Supprime toutes les opérations SIM et annule leurs effets sur le solde. */
  purgeSims: () => number;
  customPlatforms: CustomPlatform[];
  addCustomPlatform: (name: string, logo: string) => string;
  removeCustomPlatform: (id: string) => void;
  platformLabel: (id: string) => string;
  platformLogo: (id: string) => string;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

/** Statut d'une opération SIM à l'instant `now`. */
export function simStatusAt(sim: SimSchedule, now: number): TransactionStatus {
  if (now < sim.processingAt) return 'pending';
  if (now < sim.resolveAt) return 'processing';
  return sim.outcome;
}

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
  const { transactions, addTransaction, updateTransaction, removeTransactions, adjustBalance, balance, showToast } = useBanking();
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ----- Canaux personnalisés ----- */
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
    (id: string) => (id === 'payzed' ? 'Payzed' : customRef.current.find((p) => p.id === id)?.name ?? findService(id)?.name ?? 'Payzed'),
    [],
  );
  const platformLogo = useCallback((id: string) => customRef.current.find((p) => p.id === id)?.logo ?? id, []);
  const addCustomPlatform = useCallback((name: string, logo: string) => {
    const id = `custom_${Date.now()}`;
    customRef.current = [...customRef.current, { id, name: name.trim(), logo }];
    setCustomPlatforms(customRef.current);
    return id;
  }, []);
  const removeCustomPlatform = useCallback((id: string) => {
    setCustomPlatforms((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /* ----- Notifications ----- */
  const dismissNotification = useCallback(() => setNotification(null), []);
  const notify = useCallback((tx: Transaction, title: string, message: string) => {
    setNotification({ id: tx.id, brand: tx.brandLogo ?? 'payzed', tx, title, message });
    chime();
    try {
      navigator.vibrate?.([80, 60, 80]);
    } catch {
      // ignore
    }
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(null), 6000);
  }, []);

  /** Texte de notification selon le résultat. */
  const describe = (tx: Transaction, status: TransactionStatus) => {
    const amt = formatCurrency(Math.abs(tx.amount), 'XOF');
    const who = tx.title;
    const via = tx.paymentMethod;
    if (status === 'failed') {
      return tx.amount > 0
        ? { title: 'Entrée échouée', message: `L'envoi de ${amt} par ${who} via ${via} a échoué.` }
        : { title: 'Opération échouée', message: `${tx.type === 'withdrawal' ? 'Le retrait' : "L'envoi"} de ${amt} a échoué. Le montant a été recrédité.` };
    }
    if (tx.amount > 0) return { title: `+${amt} reçus`, message: `${who} vous a envoyé ${amt} via ${via}.` };
    if (tx.type === 'withdrawal') return { title: `Retrait de ${amt} effectué`, message: `Retrait via ${via} réussi.` };
    return { title: `-${amt} envoyés`, message: `Paiement de ${amt} à ${who} via ${via} réussi.` };
  };

  /* ----- Moteur : recalcul des statuts à partir des horodatages persistés ----- */
  const txRef = useRef(transactions);
  useEffect(() => {
    txRef.current = transactions;
  }, [transactions]);
  const settling = useRef(new Set<string>());

  const tick = useCallback(() => {
    const now = Date.now();
    const settledNow: Transaction[] = [];
    for (const tx of txRef.current) {
      const sim = tx.sim;
      if (!sim || sim.settled || tx.status === 'cancelled' || settling.current.has(tx.id)) continue;
      const status = simStatusAt(sim, now);
      if (now >= sim.resolveAt) {
        settling.current.add(tx.id);
        // Application du résultat — une seule fois
        if (status === 'completed' && tx.amount > 0) adjustBalance(tx.amount);
        if (status === 'failed' && sim.held > 0) adjustBalance(sim.held);
        updateTransaction(tx.id, { status, sim: { ...sim, settled: true } });
        settledNow.push({ ...tx, status });
      } else if (status !== tx.status) {
        updateTransaction(tx.id, { status });
      }
    }
    if (settledNow.length) {
      const last = settledNow[settledNow.length - 1];
      const d = describe(last, last.status);
      notify(last, d.title, d.message);
      if (settledNow.length > 1) showToast(`${settledNow.length} opérations SIM mises à jour`);
    }
  }, [adjustBalance, updateTransaction, notify, showToast]);

  useEffect(() => {
    tick(); // rattrapage au démarrage (opérations arrivées à échéance app fermée)
    const id = setInterval(tick, 1000);
    const onVisible = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [tick]);

  useEffect(
    () => () => {
      if (notifTimer.current) clearTimeout(notifTimer.current);
    },
    [],
  );

  /* ----- Création ----- */
  const balanceRef = useRef(balance);
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  const simulate = useCallback(
    (cfg: SimulationConfig): string | null => {
      primeAudio(); // le son doit être « débloqué » pendant le toucher de l'utilisateur
      const isIn = cfg.kind === 'in';
      const amount = Math.round(cfg.amount);
      if (!(amount > 0)) return 'Montant invalide';
      const fee = isIn ? 0 : feeFor(amount);
      const label = platformLabel(cfg.platform);
      const who = cfg.name.trim();
      const contact = cfg.phone?.trim() ? `${who} · ${cfg.phone.trim()}` : who;
      const now = Date.now();
      const backdated = Boolean(cfg.timestamp && now - cfg.timestamp > 60_000);
      const delay = backdated ? 0 : Math.max(0, Math.round(cfg.delayMs));
      const outcome = cfg.outcome;
      const immediateStatus: TransactionStatus = delay === 0 ? outcome : 'pending';

      // Sortie : le montant + frais doit être disponible (débité dès maintenant)
      const debitNow = !isIn && immediateStatus !== 'failed';
      if (debitNow && amount + fee > balanceRef.current) return 'Solde insuffisant (frais compris)';

      const sim: SimSchedule = {
        createdAt: now,
        processingAt: now + Math.round(delay * 0.2),
        resolveAt: now + delay,
        outcome,
        settled: delay === 0,
        held: debitNow ? amount + fee : 0,
      };

      const tx = addTransaction({
        title: cfg.kind === 'withdrawal' ? `Retrait ${label}` : who,
        subtitle: cfg.kind === 'in' ? `Reçu via ${label}` : cfg.kind === 'withdrawal' ? `Retrait · ${who}` : `Envoyé via ${label}`,
        category: 'Revenus & Virements',
        type: cfg.kind === 'in' ? 'transfer_in' : cfg.kind === 'withdrawal' ? 'withdrawal' : 'transfer_out',
        amount: isIn ? amount : -amount,
        status: immediateStatus,
        icon: isIn ? 'ArrowDownLeft' : 'ArrowUpRight',
        brandLogo: platformLogo(cfg.platform),
        sender: isIn ? contact : undefined,
        recipient: isIn ? undefined : contact,
        recipientPhone: isIn ? undefined : cfg.phone?.trim() || undefined,
        fee,
        paymentMethod: label,
        isSimulated: true,
        sim,
        timestamp: backdated ? cfg.timestamp : undefined,
        // Solde : entrée créditée seulement si réussie immédiatement ; échec immédiat sans effet
        skipBalance: isIn ? immediateStatus !== 'completed' : !debitNow,
      });

      if (backdated) showToast("Opération ajoutée à l'historique");
      else if (delay === 0) {
        const d = describe(tx, immediateStatus);
        notify(tx, d.title, d.message);
      }
      return null;
    },
    [addTransaction, notify, platformLabel, platformLogo, showToast],
  );

  const cancelSim = useCallback(
    (txId: string) => {
      const tx = txRef.current.find((t) => t.id === txId);
      if (!tx?.sim || tx.sim.settled || settling.current.has(txId)) return;
      settling.current.add(txId);
      if (tx.sim.held > 0) adjustBalance(tx.sim.held);
      updateTransaction(txId, { status: 'cancelled', sim: { ...tx.sim, settled: true } });
      showToast(tx.sim.held > 0 ? 'Opération annulée, montant recrédité' : 'Opération annulée');
    },
    [adjustBalance, updateTransaction, showToast],
  );

  const purgeSims = useCallback(() => {
    let delta = 0;
    const ids: string[] = [];
    for (const tx of txRef.current) {
      if (!tx.isSimulated) continue;
      ids.push(tx.id);
      const fee = tx.amount < 0 ? tx.fee || 0 : 0;
      if (tx.sim && !tx.sim.settled) delta += tx.sim.held; // en cours : on rend le montant bloqué
      else if (tx.status === 'completed') delta += tx.amount > 0 ? -tx.amount : Math.abs(tx.amount) + fee;
    }
    ids.forEach((id) => settling.current.add(id));
    adjustBalance(delta);
    removeTransactions(ids);
    return ids.length;
  }, [adjustBalance, removeTransactions]);

  const activeSims = transactions.filter((t) => t.sim && !t.sim.settled && t.status !== 'cancelled');

  return (
    <DemoContext.Provider
      value={{
        notification,
        dismissNotification,
        simulate,
        cancelSim,
        activeSims,
        purgeSims,
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
