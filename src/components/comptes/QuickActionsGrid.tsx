import React from 'react';
import { Send, Repeat, FileText, Smartphone } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';

export const QuickActionsGrid: React.FC = () => {
  const { setActiveModal } = useBanking();

  const actions = [
    {
      id: 'transfer',
      label: 'Virement',
      sublabel: 'P2P & Banques',
      icon: Send,
      onClick: () => setActiveModal('transfer'),
    },
    {
      id: 'subscriptions',
      label: 'Abonnements',
      sublabel: 'Gestion récurrente',
      icon: Repeat,
      onClick: () => setActiveModal('subscriptions'),
    },
    {
      id: 'bills',
      label: 'Factures',
      sublabel: 'Énergie, Eau, Rapido',
      icon: FileText,
      onClick: () => setActiveModal('bills'),
    },
    {
      id: 'topup',
      label: 'Recharge',
      sublabel: 'Pass & Crédit Mobile',
      icon: Smartphone,
      onClick: () => setActiveModal('topup'),
    },
  ];

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-black tracking-tight">
          Services & Opérations
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              className="flex items-center space-x-3 p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/90 hover:border-black transition-all duration-150 group active:scale-[0.98] text-left shadow-xs min-h-[58px]"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all shadow-xs shrink-0">
                <Icon className="w-5 h-5 stroke-[2]" />
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-black group-hover:text-neutral-700 transition-colors leading-tight">
                  {act.label}
                </span>
                <span className="text-[11px] text-neutral-500 leading-tight mt-0.5 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  {act.sublabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
