import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, ChoiceGrid, Field, SuccessView, parseAmount } from '../ui';
import type { TransactionCategory } from '../../types/banking';

const BILLS = [
  { id: 'senelec', label: 'Senelec', refLabel: 'N° de compteur ou de facture', icon: 'Zap', category: 'Logement & Factures' },
  { id: 'woyofal', label: 'Woyofal', refLabel: 'N° de compteur', icon: 'Zap', category: 'Logement & Factures' },
  { id: 'seneau', label: "Sen'Eau", refLabel: 'N° de contrat', icon: 'Droplets', category: 'Logement & Factures' },
  { id: 'rapido', label: 'Rapido', refLabel: 'N° de badge', icon: 'CreditCard', category: 'Transport & Mobilité' },
] as const satisfies readonly { id: string; label: string; refLabel: string; icon: string; category: TransactionCategory }[];
type BillId = (typeof BILLS)[number]['id'];

export const BillsModal: React.FC = () => {
  const { setActiveModal, currency, balance, addTransaction, showToast } = useBanking();
  const [billId, setBillId] = useState<BillId>('senelec');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState<number | null>(null);
  const bill = BILLS.find((b) => b.id === billId)!;
  const close = () => setActiveModal(null);
  const value = parseAmount(amount);
  const ready = reference.trim().length > 0 && value > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return showToast('Entrez la référence');
    if (!(value > 0)) return showToast('Entrez un montant');
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
        <SuccessView amount={formatCurrency(done, currency)} text={`${bill.label} · Réf. ${reference.trim()}`} onDone={close} />
      </Sheet>
    );
  }

  return (
    <Sheet title="Payer une facture" onClose={close}>
      <form onSubmit={submit} className="space-y-5">
        <ChoiceGrid
          value={billId}
          onChange={setBillId}
          options={BILLS.map((b) => ({ id: b.id, label: b.label, icon: <BrandLogo brand={b.id} size={32} className="rounded-lg" /> }))}
        />
        <Field label={bill.refLabel} value={reference} onChange={(e) => setReference(e.target.value)} inputMode="text" autoComplete="off" />
        <AmountField value={amount} onChange={setAmount} hint={`Disponible : ${formatCurrency(balance, currency)}`} />
        <Button type="submit" className="w-full" disabled={!ready}>
          {value > 0 ? `Payer ${formatCurrency(value, currency)}` : 'Payer'}
        </Button>
      </form>
    </Sheet>
  );
};
