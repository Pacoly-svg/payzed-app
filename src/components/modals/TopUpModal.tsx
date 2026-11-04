import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, ChoiceGrid, FeeSummary, Field, SuccessView, parseAmount } from '../ui';
import { feeFor } from '../../utils/fees';
import { findProvider, providersIn } from '../../data/catalog';

const OPERATORS = providersIn('telecom');

export const TopUpModal: React.FC = () => {
  const { setActiveModal, modalParams, currency, balance, user, addTransaction, showToast } = useBanking();
  const preset = findProvider(modalParams.provider);
  const [op, setOp] = useState<string>(preset?.category === 'telecom' ? preset.id : OPERATORS[0].id);
  const [phone, setPhone] = useState(user.phone);
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState<number | null>(null);
  const close = () => setActiveModal(null);
  const opLabel = OPERATORS.find((o) => o.id === op)?.name ?? op;
  const value = parseAmount(amount);
  const fee = feeFor(value);
  const ready = phone.replace(/\D/g, '').length >= 9 && value > 0 && value + fee <= balance;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 9) return showToast('Numéro incomplet');
    if (!(value > 0)) return showToast('Entrez un montant');
    if (value + fee > balance) return showToast('Solde insuffisant (frais compris)');
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
      fee,
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
    <Sheet title="Acheter du crédit" onClose={close} footer={<Button type="submit" form="topup" className="w-full" disabled={!ready}>{value > 0 ? `Payer ${formatCurrency(value, currency)}` : 'Payer'}</Button>}>
      <form id="topup" onSubmit={submit} className="space-y-5">
        <ChoiceGrid
          value={op}
          onChange={setOp}
          columns={Math.min(3, OPERATORS.length)}
          options={OPERATORS.map((o) => ({ id: o.id, label: o.name, icon: <BrandLogo brand={o.id} size={32} className="rounded-lg" /> }))}
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
        {value > 0 && <FeeSummary amount={value} fee={fee} balance={balance} />}
      </form>
    </Sheet>
  );
};
