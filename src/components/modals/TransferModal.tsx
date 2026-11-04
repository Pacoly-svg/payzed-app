import React, { useState } from 'react';
import { ScanLine } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, ChoiceGrid, FeeSummary, Field, SuccessView, TextLink, parseAmount } from '../ui';
import { feeFor } from '../../utils/fees';
import { findProvider, providersIn } from '../../data/catalog';

/** Moyens d'envoi affichés par défaut : Payzed + tous les Mobile Money du catalogue. */
const BASE_RAILS = ['payzed', ...providersIn('mobile_money').map((p) => p.id)];

const CONTACTS = [
  { name: 'Fatou Sow', phone: '+221 77 319 88 12' },
  { name: 'Cheikh Ndiaye', phone: '+221 78 440 21 09' },
  { name: 'Aminata Fall', phone: '+221 76 512 34 56' },
  { name: 'Ousmane Ba', phone: '+221 70 890 12 34' },
];

const initials = (n: string) => n.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

const PayzedMark = () => (
  <span className="w-8 h-8 rounded-lg bg-black flex items-center justify-center p-1.5">
    <img src="/assets/logo/symbole-blanc.svg" alt="" className="w-full h-full" />
  </span>
);

export const TransferModal: React.FC = () => {
  const { setActiveModal, modalParams, currency, balance, addTransaction, showToast } = useBanking();
  const preset = findProvider(modalParams.provider);
  // Un service choisi dans « Tous les services » (banque, transfert…) s'ajoute aux choix
  const [rails] = useState(() => (preset && !BASE_RAILS.includes(preset.id) ? [...BASE_RAILS, preset.id] : BASE_RAILS));
  const [rail, setRail] = useState<string>(preset?.id ?? 'payzed');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState<number | null>(null);

  const close = () => setActiveModal(null);
  const railProvider = rail === 'payzed' ? undefined : findProvider(rail);
  const railLabel = railProvider?.name ?? 'Payzed';
  const isBank = railProvider?.category === 'banks';
  const isIntl = railProvider?.category === 'transfers';
  const value = parseAmount(amount);
  const fee = feeFor(value);
  const ready = name.trim().length > 0 && value > 0 && value + fee <= balance;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return showToast('Indiquez le bénéficiaire');
    if (!(value > 0)) return showToast('Entrez un montant');
    if (value + fee > balance) return showToast('Solde insuffisant (frais compris)');
    addTransaction({
      title: name.trim(),
      subtitle: `Envoi via ${railLabel}`,
      type: 'transfer_out',
      amount: -value,
      status: 'completed',
      icon: 'ArrowUpRight',
      brandLogo: rail === 'payzed' ? undefined : rail,
      category: 'Revenus & Virements',
      recipient: phone.trim() ? `${name.trim()} · ${phone.trim()}` : name.trim(),
      recipientPhone: phone.trim() || undefined,
      fee,
      paymentMethod: railLabel,
    });
    triggerSuccessConfetti();
    setDone(value);
  };

  if (done !== null) {
    return (
      <Sheet title="Argent envoyé" onClose={close}>
        <SuccessView amount={formatCurrency(done, currency)} text={`à ${name.trim()} via ${railLabel} · frais ${formatCurrency(feeFor(done), currency)}`} onDone={close} />
      </Sheet>
    );
  }

  return (
    <Sheet title="Envoyer de l'argent" onClose={close} footer={<Button type="submit" form="transfer-form" className="w-full" disabled={!ready}>{value > 0 ? `Envoyer ${formatCurrency(value, currency)}` : 'Envoyer'}</Button>}>
      <form id="transfer-form" onSubmit={submit} className="space-y-5">
        <Button variant="secondary" className="w-full" icon={<ScanLine className="w-5 h-5" />} onClick={() => setActiveModal('scan')}>
          Scanner un QR code
        </Button>
        <div>
          <p className="text-[13px] font-semibold text-neutral-500 mb-2 px-1">Contacts récents</p>
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-5 px-5">
            {CONTACTS.map((c) => {
              const active = name === c.name;
              return (
                <button
                  key={c.phone}
                  type="button"
                  onClick={() => {
                    setName(c.name);
                    setPhone(c.phone);
                  }}
                  className="flex flex-col items-center gap-1.5 shrink-0 w-16 active:scale-95 transition-transform"
                >
                  <span
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-[15px] transition-colors ${
                      active ? 'bg-black text-white' : 'bg-neutral-100'
                    }`}
                  >
                    {initials(c.name)}
                  </span>
                  <span className={`text-[13px] truncate w-full text-center ${active ? 'font-bold' : 'font-medium text-neutral-600'}`}>
                    {c.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <ChoiceGrid
            columns={3}
            value={rail}
            onChange={setRail}
            options={rails.map((id) => ({
              id,
              label: id === 'payzed' ? 'Payzed' : findProvider(id)?.name ?? id,
              icon: id === 'payzed' ? <PayzedMark /> : <BrandLogo brand={id} size={32} className="rounded-lg" />,
            }))}
          />
          <TextLink onClick={() => setActiveModal('services')}>Banques et transferts internationaux →</TextLink>
        </div>

        <Field label="Bénéficiaire" placeholder="Nom et prénom" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        <Field
          label={isBank ? 'N° de compte (RIB)' : isIntl ? 'Numéro ou e-mail' : 'Numéro'}
          type={isBank || isIntl ? 'text' : 'tel'}
          inputMode={isBank ? 'text' : isIntl ? 'email' : 'tel'}
          placeholder={isBank ? 'SN012 01001 …' : isIntl ? '+33 6 12 34 56 78' : '77 123 45 67'}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="off"
        />
        <AmountField value={amount} onChange={setAmount} hint={`Disponible : ${formatCurrency(balance, currency)}`} />
        {value > 0 && <FeeSummary amount={value} fee={fee} balance={balance} />}
      </form>
    </Sheet>
  );
};
