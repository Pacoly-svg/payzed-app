import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, ChoiceGrid, Field, SuccessView, parseAmount } from '../ui';

const OPERATORS = [
  { id: 'orange', label: 'Orange' },
  { id: 'yas', label: 'Yas' },
  { id: 'expresso', label: 'Expresso' },
] as const;
type Operator = (typeof OPERATORS)[number]['id'];

export const TopUpModal: React.FC = () => {
  const { setActiveModal, currency, balance, user, addTransaction, showToast } = useBanking();
  const [op, setOp] = useState<Operator>('orange');
  const [phone, setPhone] = useState(user.phone);
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState<number | null>(null);
  const close = () => setActiveModal(null);
  const opLabel = OPERATORS.find((o) => o.id === op)!.label;
  const value = parseAmount(amount);
  const ready = phone.replace(/\D/g, '').length >= 9 && value > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 9) return showToast('Numéro incomplet');
    if (!(value > 0)) return showToast('Entrez un montant');
    if (value > balance) return showToast('Solde insuffisant');
    addTransaction({
      title: `Crédit ${opLabel}`,
      subtitle: phone.trim(),
      category: 'Télécom & Données',
      type: 'topup',
      amount: -value,
      status: 'completed',
      icon: 'Smartphone',
      brandLogo: op,
      recipient: `${opLabel} · ${phone.trim()}`,
      fee: 0,
      paymentMethod: 'Compte Payzed',
    });
    triggerSuccessConfetti();
    setDone(value);
  };

  if (done !== null) {
    return (
      <Sheet title="Crédit envoyé" onClose={close}>
        <SuccessView amount={formatCurrency(done, currency)} text={`${opLabel} · ${phone}`} onDone={close} />
      </Sheet>
    );
  }

  return (
    <Sheet title="Acheter du crédit" onClose={close}>
      <form id="topup" onSubmit={submit} className="space-y-5">
        <ChoiceGrid
          value={op}
          onChange={setOp}
          options={OPERATORS.map((o) => ({ id: o.id, label: o.label, icon: <BrandLogo brand={o.id} size={32} className="rounded-lg" /> }))}
        />
        <Field
          label="Numéro"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="77 123 45 67"
        />
        <AmountField value={amount} onChange={setAmount} hint={`Disponible : ${formatCurrency(balance, currency)}`} />
        <Button type="submit" className="w-full" disabled={!ready}>
          {value > 0 ? `Payer ${formatCurrency(value, currency)}` : 'Payer'}
        </Button>
      </form>
    </Sheet>
  );
};
