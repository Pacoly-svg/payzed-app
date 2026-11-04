import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { useDemo } from '../../context/DemoContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { feeFor } from '../../utils/fees';
import { formatSnPhone, isSnMobile } from '../../utils/validators';
import { findService, servicesIn } from '../../data/catalog';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, ChoiceGrid, FeeSummary, Field, ReviewView, SuccessView, parseAmount } from '../ui';

const OPERATORS = servicesIn('telecom');

export const TopUpModal: React.FC = () => {
  const { announce } = useDemo();
  const { setActiveModal, modalParams, currency, balance, user, addTransaction } = useBanking();
  const preset = findService(modalParams.provider);
  const [op, setOp] = useState<string>(preset?.category === 'telecom' ? preset.id : OPERATORS[0].id);
  const [phone, setPhone] = useState(user.phone);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'review' | 'done'>('form');
  const [showErrors, setShowErrors] = useState(false);

  const close = () => setActiveModal(null);
  const opLabel = OPERATORS.find((o) => o.id === op)?.name ?? op;
  const value = parseAmount(amount);
  const fee = feeFor(value);
  const errors = {
    phone: !isSnMobile(phone) && 'Numéro sénégalais à 9 chiffres (ex. 77 123 45 67)',
    amount: !(value > 0) ? 'Entrez un montant' : value + fee > balance ? 'Solde insuffisant (frais compris)' : false,
  };
  const valid = !errors.phone && !errors.amount;
  const number = formatSnPhone(phone);

  const execute = () => {
    const tx = addTransaction({
      title: `Crédit ${opLabel}`,
      subtitle: number,
      category: 'Télécom & Données',
      type: 'topup',
      amount: -value,
      status: 'completed',
      icon: 'Smartphone',
      brandLogo: op,
      recipient: `${opLabel} · ${number}`,
      fee,
      paymentMethod: 'Compte Payzed',
    });
    announce(tx, balance - (value + fee));
    triggerSuccessConfetti();
    setStep('done');
  };

  if (step === 'done') {
    return (
      <Sheet title="Crédit envoyé" onClose={close}>
        <SuccessView amount={formatCurrency(value, currency)} text={`${opLabel} · ${number}`} onDone={close} />
      </Sheet>
    );
  }

  if (step === 'review') {
    return (
      <Sheet title="Vérifier la recharge" onClose={close} onBack={() => setStep('form')} confirmClose>
        <ReviewView
          caption="Crédit à envoyer"
          amount={formatCurrency(value, currency)}
          rows={[
            ['Opérateur', opLabel],
            ['Numéro', number],
            ['Frais (1 %)', formatCurrency(fee, currency)],
            ['Total débité', <strong key="t">{formatCurrency(value + fee, currency)}</strong>],
          ]}
          confirmLabel="Confirmer la recharge"
          onConfirm={execute}
          onEdit={() => setStep('form')}
        />
      </Sheet>
    );
  }

  return (
    <Sheet
      title="Acheter du crédit"
      onClose={close}
      confirmClose={Boolean(amount)}
      footer={
        <Button type="submit" form="topup" className="w-full">
          Continuer
        </Button>
      }
    >
      <form
        id="topup"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setShowErrors(true);
          if (valid) setStep('review');
        }}
        className="space-y-5"
      >
        <ChoiceGrid
          value={op}
          onChange={setOp}
          columns={Math.min(3, OPERATORS.length)}
          options={OPERATORS.map((o) => ({ id: o.id, label: o.name, icon: <BrandLogo brand={o.id} size={32} className="rounded-lg" /> }))}
        />
        <Field
          label="Numéro à recharger"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="next"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="77 123 45 67"
          error={showErrors && errors.phone}
        />
        <AmountField
          value={amount}
          onChange={setAmount}
          hint={showErrors && errors.amount ? <span className="text-red-600">{errors.amount}</span> : `Disponible : ${formatCurrency(balance, currency)}`}
        />
        {value > 0 && <FeeSummary amount={value} fee={fee} balance={balance} />}
      </form>
    </Sheet>
  );
};
