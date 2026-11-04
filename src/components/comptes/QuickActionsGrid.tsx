import React from 'react';
import { Banknote, ChevronRight, FileText, LayoutGrid, PiggyBank, Smartphone } from 'lucide-react';
import { useBanking, type ModalType } from '../../context/BankingContext';

/** Parcours « par action » : ce que l'on veut faire, en un geste. */
const ACTIONS: { id: Exclude<ModalType, null>; label: string; icon: React.ElementType }[] = [
  { id: 'withdraw', label: 'Retirer', icon: Banknote },
  { id: 'topup', label: 'Crédit', icon: Smartphone },
  { id: 'bills', label: 'Factures', icon: FileText },
  { id: 'vaults', label: 'Épargne', icon: PiggyBank },
];

export const QuickActionsGrid: React.FC = () => {
  const { setActiveModal } = useBanking();
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {ACTIONS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setActiveModal(id)} className="flex flex-col items-center gap-2 py-1 active:scale-95 transition-transform">
            <span className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </span>
            <span className="text-[13px] font-semibold text-neutral-800 truncate max-w-full">{label}</span>
          </button>
        ))}
      </div>
      {/* Parcours « par opérateur » : retrouver Wave, Senelec, Canal+… */}
      <button
        type="button"
        onClick={() => setActiveModal('services')}
        className="w-full h-14 px-4 rounded-2xl bg-neutral-100 flex items-center gap-3 text-left active:bg-neutral-200 transition-colors"
      >
        <LayoutGrid className="w-5 h-5 shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-semibold">Tous les services</span>
        </span>
        <span className="text-[13px] text-neutral-500 shrink-0">Wave, Senelec, Canal+…</span>
        <ChevronRight className="w-5 h-5 text-neutral-400 shrink-0" />
      </button>
    </section>
  );
};
