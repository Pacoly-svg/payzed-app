import React, { useEffect, useRef, useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, ChoiceGrid, FeeSummary, Field, ReviewView, SuccessView, parseAmount } from '../ui';
import { feeFor } from '../../utils/fees';
import { BILL_CATEGORIES, findService, servicesIn, type CategoryId } from '../../data/catalog';
import type { TransactionCategory } from '../../types/banking';

/** Catégorie comptable (Stats) et icône d'historique pour chaque famille de factures. */
const ACCOUNTING: Partial<Record<CategoryId, { category: TransactionCategory; icon: string }>> = {
  electricity: { category: 'Logement & Factures', icon: 'Zap' },
  water: { category: 'Logement & Factures', icon: 'Droplets' },
  internet: { category: 'Télécom & Données', icon: 'Smartphone' },
  tv: { category: 'Loisirs & Shopping', icon: 'Tv' },
  transport: { category: 'Transport & Mobilité', icon: 'CreditCard' },
  taxes: { category: 'Services & Abonnements', icon: 'Shield' },
  insurance: { category: 'Services & Abonnements', icon: 'Shield' },
};

export const BillsModal: React.FC = () => {
  const { setActiveModal, modalParams, currency, balance, addTransaction } = useBanking();
  const preset = findService(modalParams.provider);
  const startCat = preset && BILL_CATEGORIES.some((c) => c.id === preset.category) ? preset.category : 'electricity';

  const [cat, setCat] = useState<CategoryId>(startCat);
  const [billId, setBillId] = useState<string>(preset?.category === startCat ? preset.id : servicesIn(startCat)[0].id);
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'review' | 'done'>('form');
  const [showErrors, setShowErrors] = useState(false);

  const chipsRef = useRef<HTMLDivElement>(null);
  // Amener la catégorie active à l'écran (utile quand on arrive depuis « Tous les services »)
  useEffect(() => {
    chipsRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [cat]);

  const providers = servicesIn(cat);
  const bill = findService(billId) ?? providers[0];
  const close = () => setActiveModal(null);
  const value = parseAmount(amount);
  const fee = feeFor(value);
  const errors = {
    reference: reference.trim().length < 3 && 'Entrez la référence (3 caractères minimum)',
    amount: !(value > 0) ? 'Entrez un montant' : value + fee > balance ? 'Solde insuffisant (frais compris)' : false,
  };
  const valid = !errors.reference && !errors.amount;
  const acc = ACCOUNTING[cat] ?? { category: 'Logement & Factures' as TransactionCategory, icon: 'FileText' };

  const chooseCategory = (c: CategoryId) => {
    setCat(c);
    setBillId(servicesIn(c)[0].id);
    setReference('');
  };

  const execute = () => {
    addTransaction({
      title: bill.name,
      subtitle: `Réf. ${reference.trim()}`,
      category: acc.category,
      type: 'bill',
      amount: -value,
      status: 'completed',
      icon: acc.icon,
      brandLogo: bill.id,
      recipient: bill.name,
      fee,
      paymentMethod: 'Compte Payzed',
    });
    triggerSuccessConfetti();
    setStep('done');
  };

  if (step === 'done') {
    return (
      <Sheet title="Facture payée" onClose={close}>
        <SuccessView amount={formatCurrency(value, currency)} text={`${bill.name} · Réf. ${reference.trim()}`} onDone={close} />
      </Sheet>
    );
  }

  if (step === 'review') {
    return (
      <Sheet title="Vérifier le paiement" onClose={close} onBack={() => setStep('form')} confirmClose>
        <ReviewView
          caption="Facture à payer"
          amount={formatCurrency(value, currency)}
          rows={[
            ['Service', bill.name],
            [bill.refLabel ?? 'Référence', reference.trim()],
            ['Frais (1 %)', formatCurrency(fee, currency)],
            ['Total débité', <strong key="t">{formatCurrency(value + fee, currency)}</strong>],
          ]}
          confirmLabel="Confirmer le paiement"
          onConfirm={execute}
          onEdit={() => setStep('form')}
        />
      </Sheet>
    );
  }

  return (
    <Sheet
      title="Payer une facture"
      onClose={close}
      confirmClose={Boolean(reference || amount)}
      footer={
        <Button type="submit" form="bills-form" className="w-full">
          Continuer
        </Button>
      }
    >
      <form
        id="bills-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setShowErrors(true);
          if (valid) setStep('review');
        }}
        className="space-y-5"
      >
        <div ref={chipsRef} className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
          {BILL_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={cat === c.id}
              onClick={() => chooseCategory(c.id)}
              className={`h-9 px-4 rounded-full text-sm font-bold shrink-0 transition-colors ${
                cat === c.id ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <ChoiceGrid
          columns={3}
          value={bill.id}
          onChange={(id) => {
            setBillId(id);
            setReference('');
          }}
          options={providers.map((p) => ({ id: p.id, label: p.name, icon: <BrandLogo brand={p.id} size={32} className="rounded-lg" /> }))}
        />
        <Field
          label={bill.refLabel ?? 'Référence'}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          autoComplete="off"
          enterKeyHint="next"
          error={showErrors && errors.reference}
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
