import type { Transaction, TransactionStatus } from '../types/banking';

export const STATUS_LABEL: Record<TransactionStatus, string> = {
  pending: 'En attente',
  processing: 'En cours de traitement',
  completed: 'Réussie',
  failed: 'Échouée',
  cancelled: 'Annulée',
};

/** Couleurs des statuts (réservées aux statuts, toujours accompagnées d'un libellé). */
export const STATUS_STYLE: Record<TransactionStatus, string> = {
  pending: 'bg-neutral-100 text-neutral-700',
  processing: 'bg-neutral-200 text-neutral-800',
  completed: 'bg-neutral-100 text-neutral-800',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-neutral-200 text-neutral-700',
};

/** L'opération compte-t-elle dans les dépenses / revenus (Stats, carte) ? */
export const countsAsMoved = (t: Transaction) => t.status === 'completed' && !(t.sim && !t.sim.settled);

/** Visible dans l'historique ? (les opérations programmées n'existent qu'à leur arrivée) */
export const isVisibleInHistory = (t: Transaction) => !(t.sim && !t.sim.settled) && t.status !== 'cancelled';

/** 90061000 → « 1 j 1 h », 125000 → « 2 min 5 s ». */
export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return `${d} j${h ? ` ${h} h` : ''}`;
  if (h) return `${h} h${m ? ` ${String(m).padStart(2, '0')} min` : ''}`;
  if (m) return `${m} min${sec ? ` ${sec} s` : ''}`;
  return `${sec} s`;
}
