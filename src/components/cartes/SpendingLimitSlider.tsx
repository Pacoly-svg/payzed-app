import React, { useState, useEffect } from 'react';
import { Sliders } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';

export const SpendingLimitSlider: React.FC = () => {
  const { card, currency, updateSpendingLimit } = useBanking();

  const minLimit = currency === 'XOF' ? 500000 : 1000;
  const maxLimit = currency === 'XOF' ? 20000000 : 30000;
  const step = currency === 'XOF' ? 250000 : 500;

  const [sliderVal, setSliderVal] = useState(card.spendingLimit);

  useEffect(() => {
    if (card.spendingLimit > maxLimit) {
      setSliderVal(maxLimit);
    } else if (card.spendingLimit < minLimit) {
      setSliderVal(minLimit);
    } else {
      setSliderVal(card.spendingLimit);
    }
  }, [card.spendingLimit, currency, minLimit, maxLimit]);

  const percentage = Math.min(100, Math.round((card.currentMonthSpent / sliderVal) * 100));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderVal(val);
  };

  const handleCommit = () => {
    updateSpendingLimit(sliderVal);
  };

  return (
    <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black">
            <Sliders className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-black">Plafond mensuel de dépenses</h3>
            <p className="text-[10px] text-neutral-500 font-medium">Ajustement sécurisé en direct</p>
          </div>
        </div>

        <span className="text-xs font-extrabold font-mono text-black">
          {formatCurrency(sliderVal, currency)}
        </span>
      </div>

      {/* Barre de progression en noir contrasté */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-neutral-500 font-medium">
          <span>Consommé ce mois : <strong className="text-black">{formatCurrency(card.currentMonthSpent, currency)}</strong></span>
          <span className="font-bold text-black">{percentage}%</span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden border border-neutral-200/50">
          <div 
            className="h-full rounded-full bg-black transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Curseur de Réglage */}
      <div className="space-y-1.5">
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          step={step}
          value={sliderVal}
          onChange={handleChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
        />
        <div className="flex justify-between text-[9px] text-neutral-500 font-mono font-medium">
          <span>Min : {formatCurrency(minLimit, currency, { hideFractions: true })}</span>
          <span>Max : {formatCurrency(maxLimit, currency, { hideFractions: true })}</span>
        </div>
      </div>
    </div>
  );
};
