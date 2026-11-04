import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import type { TransactionCategory } from '../../types/banking';

const BILLS: { id: string; label: string; refHint: string; icon: string; category: TransactionCategory }[] = [
  { id: 'senelec', label: 'Senelec', refHint: 'N° de compteur / facture', icon: 'Zap', category: 'Logement & Factures' },
  { id: 'woyofal', label: 'Woyofal', refHint: 'N° de compteur', icon: 'Zap', category: 'Logement & Factures' },
  { id: 'seneau', label: "Sen'Eau", refHint: 'N° de contrat', icon: 'Droplets', category: 'Logement & Factures' },
  { id: 'rapido', label: 'Rapido', refHint: 'N° de badge', icon: 'CreditCard', category: 'Transport & Mobilité' },
];

export const BillsModal: React.FC = () => {
  const { setActiveModal, currency, balance, addTransaction, showToast } = useBanking();
  const [billId, setBillId] = useState(BILLS[0].id);
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState<number | null>(null);
  const bill = BILLS.find((b) => b.id === billId)!;
  const close = () => setActiveModal(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Math.round(Number(amount));
    if (!reference.trim()) return showToast('Indiquez la référence');
    if (!(value > 0)) return showToast('Montant invalide');
    if (value > balance) return showToast('Solde insuffisant');
    addTransaction({
      title: bill.label,
      subtitle: `Réf. ${reference.trim()}`,
      category: bill.category,
      type: 'bill',
      amount: -value,
      status: 'completed',
      icon: bill.icon,
      brandLogo: bill.id,
      recipient: bill.label,
      fee: 0,
      paymentMethod: 'Compte Payzed',
    });
    triggerSuccessConfetti();
    setDone(value);
  };

  if (done !== null) {
    return (
      <Sheet title="Facture payée" onClose={close}>
        <div className="py-6 text-center space-y-3">
          <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-600" />
          <p className="text-2xl font-extrabold">{formatCurrency(done, currency)}</p>
          <p className="text-sm text-neutral-500">{bill.label} · Réf. {reference}</p>
          <button type="button" onClick={close} className="w-full mt-4 py-4 rounded-full bg-black text-white font-bold">
            Terminé
          </button>
        </div>
      </Sheet>
    );
  }

  const field =
    'w-full px-4 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-base font-semibold focus:outline-none focus:border-black';

  return (
    <Sheet title="Payer une facture" onClose={close}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {BILLS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBillId(b.id)}
              className={`py-3 rounded-2xl border flex flex-col items-center gap-1.5 text-[11px] font-bold ${
                billId === b.id ? 'border-black bg-neutral-50' : 'border-neutral-200'
              }`}
            >
              <BrandLogo brand={b.id} size={32} className="rounded-lg" />
              {b.label}
            </button>
          ))}
        </div>
        <input className={field} placeholder={bill.refHint} value={reference} onChange={(e) => setReference(e.target.value)} />
        <div>
          <input
            className={`${field} text-2xl font-extrabold`}
            inputMode="numeric"
            placeholder="Montant"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
          />
          <p className="text-xs text-neutral-500 mt-1.5 px-1">Disponible : {formatCurrency(balance, currency)}</p>
        </div>
        <button type="submit" className="w-full py-4 rounded-full bg-black text-white font-bold active:scale-[0.98] transition-transform">
          Payer
        </button>
      </form>
    </Sheet>
  );
};
