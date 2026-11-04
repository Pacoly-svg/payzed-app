import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Wifi, 
  PhoneCall, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { BrandLogo } from '../common/BrandLogo';

export const TopUpModal: React.FC = () => {
  const { activeModal, setActiveModal, currency, balance, addTransaction, showToast } = useBanking();
  
  const [operator, setOperator] = useState<'Orange Sénégal' | 'Wave' | 'Yas Sénégal' | 'Expresso Sénégal'>('Orange Sénégal');
  const [phone, setPhone] = useState('+221 77 482 19 02');
  const [topupType, setTopupType] = useState<'credit' | 'data'>('credit');
  const [amount, setAmount] = useState('5000');
  const [isSuccess, setIsSuccess] = useState(false);

  if (activeModal !== 'topup') return null;

  const operators = [
    { name: 'Orange Sénégal' as const, logo: 'orange', bg: 'bg-[#FF7900]' },
    { name: 'Wave' as const, logo: 'wave', bg: 'bg-[#1DC3F3]' },
    { name: 'Yas Sénégal' as const, logo: 'yas', bg: 'bg-[#06377a]' },
    { name: 'Expresso Sénégal' as const, logo: 'expresso', bg: 'bg-[#FFD100]' },
  ];

  const creditPresets = ['2000', '5000', '10000', '25000'];

  const dataPacks = [
    { label: 'Pass Illimix Jour (2 Go)', amount: '1000' },
    { label: 'Pass Illimix Semaine (7 Go)', amount: '3000' },
    { label: 'Pass Mois Maxi (25 Go)', amount: '10000' },
    { label: 'Pass Illimix Pro (50 Go)', amount: '20000' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    if (parsed > balance) {
      showToast('Solde disponible insuffisant');
      return;
    }

    const currentOp = operators.find((op) => op.name === operator);
    const chosenLogo = currentOp ? currentOp.logo : 'orange_money';

    addTransaction({
      title: `Recharge ${operator} ${topupType === 'credit' ? 'Crédit' : 'Pass Data'}`,
      subtitle: `${phone} • Rechargement immédiat`,
      category: 'Télécom & Données',
      type: 'topup',
      amount: -parsed,
      currency,
      status: 'completed',
      icon: 'Smartphone',
      brandLogo: chosenLogo,
      recipient: `${operator} (${phone})`,
      fee: 0,
      paymentMethod: 'Compte Payzed Sénégal',
    });

    setIsSuccess(true);
    triggerSuccessConfetti();

    setTimeout(() => {
      setIsSuccess(false);
      setActiveModal(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-neutral-200 text-black overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black">
              <Smartphone className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-black">Recharge Mobile & Pass Sénégal</h2>
              <p className="text-[10px] text-neutral-500 font-medium">Recharge instantanée sans frais</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-bold text-black">Recharge Envoyée</h3>
            <p className="text-xs text-neutral-500 font-medium">
              Le numéro {phone} a été rechargé de {amount} {currency}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Opérateur au Sénégal */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                Opérateur au Sénégal
              </label>
              <div className="grid grid-cols-2 gap-2">
                {operators.map((op) => (
                  <button
                    key={op.name}
                    type="button"
                    onClick={() => setOperator(op.name)}
                    className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 text-left ${
                      operator === op.name
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:text-black hover:bg-neutral-100'
                    }`}
                  >
                    <BrandLogo brand={op.logo} size={32} className="w-8 h-8 rounded-xl shrink-0" />
                    <span className="truncate">{op.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Type : Crédit ou Data */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 rounded-2xl border border-neutral-200">
              <button
                type="button"
                onClick={() => setTopupType('credit')}
                className={`flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  topupType === 'credit'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Crédit d'appel</span>
              </button>
              <button
                type="button"
                onClick={() => setTopupType('data')}
                className={`flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  topupType === 'data'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Pass Internet</span>
              </button>
            </div>

            {/* Numéro de téléphone */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Numéro du bénéficiaire
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-300 text-black text-xs font-mono focus:outline-none focus:border-black font-semibold"
                placeholder="+221 7X XXX XX XX"
                required
              />
            </div>

            {/* Choix du montant ou pack */}
            {topupType === 'credit' ? (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                  Montant ({currency})
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {creditPresets.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`py-2 rounded-xl border text-xs font-bold font-mono transition-all ${
                        amount === val
                          ? 'bg-black text-white border-black'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:text-black'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-neutral-50 border border-neutral-300 text-black text-xs font-mono focus:outline-none focus:border-black"
                  placeholder="Ou montant personnalisé"
                />
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                  Pass Internet disponibles
                </label>
                <div className="space-y-1.5">
                  {dataPacks.map((pack) => (
                    <button
                      key={pack.label}
                      type="button"
                      onClick={() => setAmount(pack.amount)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                        amount === pack.amount
                          ? 'bg-black text-white border-black'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:text-black'
                      }`}
                    >
                      <span className="text-xs font-bold">{pack.label}</span>
                      <span className="text-xs font-mono font-bold">{pack.amount} {currency}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Validation */}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] flex items-center justify-center space-x-2"
            >
              <span>Envoyer la recharge</span>
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
