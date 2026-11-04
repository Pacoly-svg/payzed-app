import React from 'react';
import { Banknote, PiggyBank, Receipt, Smartphone } from 'lucide-react';
import { useBanking, type ModalType } from '../../context/BankingContext';

/**
 * Parcours « par action ». « Paiement » ouvre le catalogue complet : factures,
 * banques, Mobile Money, transferts, TV, abonnements… (par service ou par opérateur).
 */
const ACTIONS: { id: Exclude<ModalType, null>; label: string; icon: React.ElementType }[] = [
  { id: 'withdraw', label: 'Retirer', icon: Banknote },
  { id: 'topup', label: 'Crédit', icon: Smartphone },
  { id: 'services', label: 'Paiement', icon: Receipt },
  { id: 'vaults', label: 'Épargne', icon: PiggyBank },
];

export const QuickActionsGrid: React.FC = () => {
  const { setActiveModal } = useBanking();
  return (
    <section className="grid grid-cols-4 gap-2">
      {ACTIONS.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" onClick={() => setActiveModal(id)} className="flex flex-col items-center gap-2 py-1 active:scale-95 transition-transform">
          <span className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </span>
          <span className="text-[13px] font-semibold text-neutral-800 truncate max-w-full">{label}</span>
        </button>
      ))}
    </section>
  );
};
