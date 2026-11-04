import React, { useState } from 'react';
import { ScanLine } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { feeFor } from '../../utils/fees';
import { formatSnPhone, isAccount, isEmail, isIntlPhone, isName, isSnMobile } from '../../utils/validators';
import { findService, servicesIn } from '../../data/catalog';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, ChoiceGrid, FeeSummary, Field, ReviewView, SuccessView, TextLink, parseAmount } from '../ui';

/** Moyens d'envoi affichés par défaut : Payzed + tous les portefeuilles Mobile Money. */
const BASE_RAILS = ['payzed', ...servicesIn('mobile_money').map((s) => s.id)];

const CONTACTS = [
  { name: 'Fatou Sow', phone: '+221 77 319 88 12' },
  { name: 'Cheikh Ndiaye', phone: '+221 78 440 21 09' },
  { name: 'Aminata Fall', phone: '+221 76 512 34 56' },
  { name: 'Ousmane Ba', phone: '+221 70 890 12 34' },
];

const initials = (n: string) => n.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

export const TransferModal: React.FC = () => {
  const { setActiveModal, modalParams, currency, balance, addTransaction } = useBanking();
  const preset = findService(modalParams.provider);
  const presetIsRail = preset && ['mobile_money', 'banks', 'transfers'].includes(preset.category);
  // Un service choisi dans « Paiement » (banque, transfert…) s'ajoute aux choix
  const [rails] = useState(() => (presetIsRail && !BASE_RAILS.includes(preset.id) ? [...BASE_RAILS, preset.id] : BASE_RAILS));
  const [rail, setRail] = useState<string>(presetIsRail ? preset.id : 'payzed');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'review' | 'done'>('form');
  const [showErrors, setShowErrors] = useState(false);

  const close = () => setActiveModal(null);
  const service = rail === 'payzed' ? undefined : findService(rail);
  const railLabel = service?.name ?? 'Payzed';
  const isBank = service?.category === 'banks';
  const isIntl = service?.category === 'transfers';
  const value = parseAmount(amount);
  const fee = feeFor(value);

  const errors = {
    name: !isName(name) && 'Indiquez le nom du bénéficiaire',
    phone: isBank
      ? !isAccount(phone) && 'Numéro de compte invalide (10 caractères minimum)'
      : isIntl
        ? !(isEmail(phone) || isIntlPhone(phone)) && 'Numéro ou e-mail invalide'
        : !isSnMobile(phone) && 'Numéro sénégalais à 9 chiffres (ex. 77 123 45 67)',
    amount: !(value > 0) ? 'Entrez un montant' : value + fee > balance ? 'Solde insuffisant (frais compris)' : false,
  };
  const valid = !errors.name && !errors.phone && !errors.amount;
  const dirty = Boolean(name || phone || amount) && step !== 'done';
  const recipientLabel = isBank || isIntl ? phone.trim() : formatSnPhone(phone);

  const execute = () => {
    addTransaction({
      title: name.trim(),
      subtitle: `Envoi via ${railLabel}`,
      category: 'Revenus & Virements',
      type: 'transfer_out',
      amount: -value,
      status: 'completed',
      icon: 'ArrowUpRight',
      brandLogo: rail === 'payzed' ? undefined : rail,
      recipient: `${name.trim()} · ${recipientLabel}`,
      recipientPhone: isBank ? undefined : recipientLabel,
      fee,
      paymentMethod: railLabel,
    });
    triggerSuccessConfetti();
    setStep('done');
  };

  if (step === 'done') {
    return (
      <Sheet title="Argent envoyé" onClose={close}>
        <SuccessView amount={formatCurrency(value, currency)} text={`à ${name.trim()} via ${railLabel} · frais ${formatCurrency(fee, currency)}`} onDone={close} />
      </Sheet>
    );
  }

  if (step === 'review') {
    return (
      <Sheet title="Vérifier l'envoi" onClose={close} onBack={() => setStep('form')} confirmClose>
        <ReviewView
          caption="Vous allez envoyer"
          amount={formatCurrency(value, currency)}
          rows={[
            ['Bénéficiaire', name.trim()],
            [isBank ? 'Compte' : isIntl ? 'Contact' : 'Numéro', recipientLabel],
            ['Via', railLabel],
            ['Frais (1 %)', formatCurrency(fee, currency)],
            ['Total débité', <strong key="t">{formatCurrency(value + fee, currency)}</strong>],
          ]}
          confirmLabel="Confirmer l'envoi"
          onConfirm={execute}
          onEdit={() => setStep('form')}
        />
      </Sheet>
    );
  }

  return (
    <Sheet
      title="Envoyer de l'argent"
      onClose={close}
      confirmClose={dirty}
      footer={
        <Button type="submit" form="transfer-form" className="w-full">
          Continuer
        </Button>
      }
    >
      <form
        id="transfer-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setShowErrors(true);
          if (valid) setStep('review');
        }}
        className="space-y-5"
      >
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
                  <span className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-[15px] transition-colors ${active ? 'bg-black text-white' : 'bg-neutral-100'}`}>
                    {initials(c.name)}
                  </span>
                  <span className={`text-[13px] truncate w-full text-center ${active ? 'font-bold' : 'font-medium text-neutral-600'}`}>{c.name.split(' ')[0]}</span>
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
              label: id === 'payzed' ? 'Payzed' : findService(id)?.name ?? id,
              icon: <BrandLogo brand={id} size={32} className="rounded-lg" />,
            }))}
          />
          <TextLink onClick={() => setActiveModal('services')}>Banques et transferts internationaux →</TextLink>
        </div>

        <Field
          label="Bénéficiaire"
          placeholder="Nom et prénom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          enterKeyHint="next"
          error={showErrors && errors.name}
        />
        <Field
          label={isBank ? 'N° de compte (RIB)' : isIntl ? 'Numéro ou e-mail' : 'Numéro'}
          type={isBank || isIntl ? 'text' : 'tel'}
          inputMode={isBank ? 'text' : isIntl ? 'email' : 'tel'}
          placeholder={isBank ? 'SN012 01001 …' : isIntl ? '+33 6 12 34 56 78' : '77 123 45 67'}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="off"
          enterKeyHint="next"
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
