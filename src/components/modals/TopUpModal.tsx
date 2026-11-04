import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';

const OPERATORS = [
  { id: 'orange', label: 'Orange' },
  { id: 'yas', label: 'Yas' },
  { id: 'expresso', label: 'Expresso' },
] as const;

const AMOUNTS = [1000, 2000, 5000, 10000];

export const TopUpModal: React.FC = () => {
  const { setActiveModal, currency, balance, user, addTransaction, showToast } = useBanking();
  const [op, setOp] = useState<(typeof OPERATORS)[number]['id']>('orange');
  const [phone, setPhone] = useState(user.phone);
  const [amount, setAmount] = useState(2000);
  const [done, setDone] = useState(false);
  const close = () => setActiveModal(null);
  const opLabel = OPERATORS.find((o) => o.id === op)!.label;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return showToast('Indiquez le numéro');
    if (amount > balance) return showToast('Solde insuffisant');
    addTransaction({
      title: `Crédit ${opLabel}`,
      subtitle: phone.trim(),
      category: 'Télécom & Données',
      type: 'topup',
      amount: -amount,
      status: 'completed',
      icon: 'Smartphone',
      brandLogo: op,
      recipient: `${opLabel} (${phone.trim()})`,
      fee: 0,
      paymentMethod: 'Compte Payzed',
    });
    triggerSuccessConfetti();
    setDone(true);
  };

  if (done) {
    return (
      <Sheet title="Recharge effectuée" onClose={close}>
        <div className="py-6 text-center space-y-3">
          <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-600" />
          <p className="text-2xl font-extrabold">{formatCurrency(amount, currency)}</p>
          <p className="text-sm text-neutral-500">{opLabel} · {phone}</p>
          <button type="button" onClick={close} className="w-full mt-4 py-4 rounded-full bg-black text-white font-bold">
            Terminé
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet title="Acheter du crédit" onClose={close}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {OPERATORS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOp(o.id)}
              className={`py-3 rounded-2xl border flex flex-col items-center gap-1.5 text-xs font-bold ${
                op === o.id ? 'border-black bg-neutral-50' : 'border-neutral-200'
              }`}
            >
              <BrandLogo brand={o.id} size={32} className="rounded-lg" />
              {o.label}
            </button>
          ))}
        </div>

        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Numéro"
          className="w-full px-4 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-base font-semibold focus:outline-none focus:border-black"
        />

        <div className="grid grid-cols-4 gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a)}
              className={`py-3 rounded-2xl text-sm font-bold ${amount === a ? 'bg-black text-white' : 'bg-neutral-100'}`}
            >
              {a.toLocaleString('fr-FR')}
            </button>
          ))}
        </div>

        <button type="submit" className="w-full py-4 rounded-full bg-black text-white font-bold active:scale-[0.98] transition-transform">
          Payer {formatCurrency(amount, currency)}
        </button>
      </form>
    </Sheet>
  );
};
