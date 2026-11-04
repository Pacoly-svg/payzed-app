import React from 'react';
import { Lock, ChevronRight } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { haptic } from '../../utils/haptics';
import { AppleEmoji } from '../common/AppleEmoji';

export const VaultsPreviewCard: React.FC = () => {
  const { vaults, currency, setActiveModal } = useBanking();

  const totalSaved = vaults.reduce((sum, v) => sum + v.currentAmount, 0);

  return (
    <div
      onClick={() => {
        haptic.light();
        setActiveModal('vaults');
      }}
      className="p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/90 hover:border-black/30 transition-all cursor-pointer shadow-xs active:scale-[0.99] flex items-center justify-between gap-3 group"
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
          <Lock className="w-5 h-5 stroke-[2]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="text-xs sm:text-sm font-bold text-black tracking-tight truncate">
              Coffres & Épargne
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-800 shrink-0">
              {vaults.length} coffres
            </span>
          </div>

          <div className="flex items-center space-x-1.5 mt-1">
            <div className="flex items-center -space-x-1">
              {vaults.map((v) => (
                <div
                  key={v.id}
                  className="w-5 h-5 rounded-md bg-white border border-neutral-200/80 shadow-2xs flex items-center justify-center p-0.5"
                  title={`${v.name} (${v.isLocked ? 'Verrouillé' : 'Actif'})`}
                >
                  <AppleEmoji emoji={v.emoji} size={14} />
                </div>
              ))}
            </div>
            <span className="text-[10px] text-neutral-500 font-medium truncate ml-1">
              Fonds protégés des débits
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <div className="text-right">
          <span className="text-xs sm:text-sm font-black font-sans text-black block tracking-tight">
            {formatCurrency(totalSaved, currency)}
          </span>
          <span className="text-[9px] text-neutral-400 font-bold block uppercase tracking-wider">
            Épargne totale
          </span>
        </div>

        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
};
