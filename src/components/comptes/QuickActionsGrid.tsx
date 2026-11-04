import React from 'react';
import { FileText, PiggyBank, Repeat, Smartphone } from 'lucide-react';
import { useBanking, type ModalType } from '../../context/BankingContext';

const ACTIONS: { id: Exclude<ModalType, null>; label: string; icon: React.ElementType }[] = [
  { id: 'topup', label: 'Crédit', icon: Smartphone },
  { id: 'bills', label: 'Factures', icon: FileText },
  { id: 'vaults', label: 'Épargne', icon: PiggyBank },
  { id: 'subscriptions', label: 'Abos', icon: Repeat },
];

export const QuickActionsGrid: React.FC = () => {
  const { setActiveModal } = useBanking();
  return (
    <section className="grid grid-cols-4 gap-2">
      {ACTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setActiveModal(id)}
          className="flex flex-col items-center gap-2 py-1 active:scale-95 transition-transform"
        >
          <span className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </span>
          <span className="text-xs font-semibold text-neutral-800 truncate max-w-full">{label}</span>
        </button>
      ))}
    </section>
  );
};
