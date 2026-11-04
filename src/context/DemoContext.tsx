/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useBanking } from './BankingContext';
import { formatTransactionDate } from '../utils/formatters';
import { feeFor } from '../utils/fees';
import { findMerchant, findService, type CategoryId } from '../data/catalog';
import { operationMessage } from '../utils/messages';
import { cancelNotification, notifyAt, notifyNow } from '../utils/notify';
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
 * Opération PROGRAMMÉE (durée > 0) : elle n'apparaît nulle part dans l'historique et ne
 * touche pas au solde tant qu'elle n'est pas « arrivée ». À l'échéance, elle apparaît à la
 * date d'arrivée avec son résultat (réussie → solde ajusté ; échouée → visible en rouge,
 * aucun mouvement). Une notification système Android est programmée pour cette échéance,
 * avec le son du téléphone, même si l'app est fermée. Annulée → elle disparaît.
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

export type SimKind = 'in' | 'deposit' | 'out' | 'withdrawal' | 'purchase';

/** Sorties d'argent : frais de 1 % (envoi, retrait, achat). Entrées et dépôts : gratuits. */
export const isOutgoing = (k: SimKind) => k === 'out' || k === 'withdrawal' || k === 'purchase';

export interface SimulationConfig {
  kind: SimKind;
  /** Canal officiel (wave, orange_money…), commerçant (m_auchan…) ou canal personnalisé. */
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
  /** Opérations SIM programmées, pas encore arrivées. */
  activeSims: Transaction[];
  /** Notification système + bandeau pour une opération qui vient d'aboutir (tous parcours). */
  announce: (tx: Transaction, newBalance?: number) => void;
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
    (id: string) =>
      id === 'payzed' ? 'Payzed' : customRef.current.find((p) => p.id === id)?.name ?? findMerchant(id)?.name ?? findService(id)?.name ?? 'Payzed',
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
  const balanceRef = useRef(balance);
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  /** Bandeau dans l'app + son ; `system` : notification Android (barre de notification, son du téléphone). */
  const showBanner = useCallback((tx: Transaction, newBalance?: number) => {
    const msg = operationMessage(tx, newBalance);
    setNotification({ id: tx.id, brand: tx.brandLogo ?? 'payzed', tx, title: msg.title, message: msg.body });
    chime();
    try {
      navigator.vibrate?.([80, 60, 80]);
    } catch {
      // ignore
    }
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(null), 6000);
  }, []);

  const announce = useCallback((tx: Transaction, newBalance?: number) => {
    void notifyNow(tx.id, operationMessage(tx, newBalance));
  }, []);

  /* ----- Moteur : recalcul des statuts à partir des horodatages persistés ----- */
  const txRef = useRef(transactions);
  useEffect(() => {
    txRef.current = transactions;
  }, [transactions]);
  const settling = useRef(new Set<string>());

  /** Effet d'une opération réussie sur le solde. */
  const deltaOf = (tx: Transaction) => (tx.amount > 0 ? tx.amount : tx.amount - (tx.fee || 0));

  const tick = useCallback(() => {
    const now = Date.now();
    const arrived: { tx: Transaction; newBalance: number }[] = [];
    let running = balanceRef.current;
    for (const tx of txRef.current) {
      const sim = tx.sim;
      if (!sim || sim.settled || tx.status === 'cancelled' || settling.current.has(tx.id)) continue;
      let status = simStatusAt(sim, now);
      if (now >= sim.resolveAt) {
        settling.current.add(tx.id);
        // Application du résultat — une seule fois
        if (sim.held > 0) {
          // Ancien format (v1.6) : montant déjà débité à la création
          if (status === 'failed') {
            adjustBalance(sim.held);
            running += sim.held;
          }
        } else if (status === 'completed') {
          const delta = deltaOf(tx);
          if (running + delta < 0) status = 'failed'; // solde insuffisant au moment de l'arrivée
          else {
            adjustBalance(delta);
            running += delta;
          }
        }
        const arrivedAt = sim.resolveAt;
        updateTransaction(tx.id, { status, timestamp: arrivedAt, date: formatTransactionDate(arrivedAt), sim: { ...sim, settled: true } });
        arrived.push({ tx: { ...tx, status, timestamp: arrivedAt }, newBalance: running });
      } else if (status !== tx.status) {
        updateTransaction(tx.id, { status });
      }
    }
    if (arrived.length) {
      const last = arrived[arrived.length - 1];
      showBanner(last.tx, last.tx.status === 'completed' ? last.newBalance : undefined);
      if (arrived.length > 1) showToast(`${arrived.length} opérations arrivées`);
    }
  }, [adjustBalance, updateTransaction, showBanner, showToast]);

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
  const simulate = useCallback(
    (cfg: SimulationConfig): string | null => {
      primeAudio(); // le son doit être « débloqué » pendant le toucher de l'utilisateur
      const kind = cfg.kind;
      const outgoing = isOutgoing(kind);
      const amount = Math.round(cfg.amount);
      if (!(amount > 0)) return 'Montant invalide';
      const fee = outgoing ? feeFor(amount) : 0;
      const label = platformLabel(cfg.platform);
      const merchant = kind === 'purchase' ? findMerchant(cfg.platform) : undefined;
      const who = cfg.name.trim();
      const contact = cfg.phone?.trim() ? `${who} · ${cfg.phone.trim()}` : who;
      const now = Date.now();
      const backdated = Boolean(cfg.timestamp && now - cfg.timestamp > 60_000);
      const delay = backdated ? 0 : Math.max(0, Math.round(cfg.delayMs));
      const scheduled = delay > 0;
      const outcome = cfg.outcome;

      if (!scheduled && outgoing && outcome === 'completed' && amount + fee > balanceRef.current) return 'Solde insuffisant (frais compris)';

      const sim: SimSchedule = {
        createdAt: now,
        processingAt: now + Math.round(delay * 0.2),
        resolveAt: now + delay,
        outcome,
        settled: !scheduled,
        held: 0,
      };

      const base = {
        kind,
        title:
          kind === 'purchase'
            ? merchant?.name ?? label
            : kind === 'withdrawal'
              ? `Retrait ${label}`
              : kind === 'deposit'
                ? `Dépôt ${label}`
                : who,
      };
      const tx = addTransaction({
        title: base.title,
        subtitle:
          kind === 'in'
            ? `Reçu via ${label}`
            : kind === 'deposit'
              ? `Dépôt · ${who}`
              : kind === 'withdrawal'
                ? `Retrait · ${who}`
                : kind === 'purchase'
                  ? `Achat · ${merchant?.kind ?? 'Commerce'}`
                  : `Envoyé via ${label}`,
        category: kind === 'purchase' ? 'Loisirs & Shopping' : 'Revenus & Virements',
        type: kind === 'in' ? 'transfer_in' : kind === 'deposit' ? 'deposit' : kind === 'withdrawal' ? 'withdrawal' : kind === 'purchase' ? 'card_payment' : 'transfer_out',
        amount: outgoing ? -amount : amount,
        status: scheduled ? 'pending' : outcome,
        icon: kind === 'purchase' ? 'ShoppingBag' : outgoing ? 'ArrowUpRight' : 'ArrowDownLeft',
        brandLogo: kind === 'purchase' ? cfg.platform : platformLogo(cfg.platform),
        sender: !outgoing ? contact : undefined,
        recipient: outgoing ? (kind === 'purchase' ? base.title : contact) : undefined,
        recipientPhone: outgoing && kind !== 'purchase' ? cfg.phone?.trim() || undefined : undefined,
        fee,
        paymentMethod: kind === 'purchase' ? 'Carte Payzed' : label,
        isSimulated: true,
        sim,
        timestamp: backdated ? cfg.timestamp : undefined,
        // Programmée ou échouée : aucun effet sur le solde maintenant
        skipBalance: scheduled || outcome === 'failed',
      });

      if (backdated) {
        showToast("Opération ajoutée à l'historique");
      } else if (scheduled) {
        // Notification système à l'heure d'arrivée (même app fermée)
        void notifyAt(tx.id, operationMessage({ ...tx, status: outcome }), sim.resolveAt);
      } else {
        const newBalance = outcome === 'completed' ? balanceRef.current + deltaOf(tx) : undefined;
        showBanner(tx, newBalance);
        void notifyNow(tx.id, operationMessage(tx, newBalance));
      }
      return null;
    },
    [addTransaction, showBanner, platformLabel, platformLogo, showToast],
  );

  const cancelSim = useCallback(
    (txId: string) => {
      const tx = txRef.current.find((t) => t.id === txId);
      if (!tx?.sim || tx.sim.settled || settling.current.has(txId)) return;
      settling.current.add(txId);
      if (tx.sim.held > 0) adjustBalance(tx.sim.held);
      void cancelNotification(txId);
      // Une opération programmée annulée n'a jamais existé pour l'utilisateur
      removeTransactions([txId]);
      showToast('Opération programmée annulée');
    },
    [adjustBalance, removeTransactions, showToast],
  );

  const purgeSims = useCallback(() => {
    let delta = 0;
    const ids: string[] = [];
    for (const tx of txRef.current) {
      if (!tx.isSimulated) continue;
      ids.push(tx.id);
      if (tx.sim && !tx.sim.settled) {
        delta += tx.sim.held; // ancien format : montant bloqué rendu
        void cancelNotification(tx.id);
      } else if (tx.status === 'completed' && !(tx.sim && tx.sim.held > 0)) delta -= deltaOf(tx);
      else if (tx.status === 'completed' && tx.sim && tx.sim.held > 0) delta += tx.sim.held;
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
        announce,
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
