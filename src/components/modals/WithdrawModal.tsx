import React, { useState } from 'react';
import { Copy, Store, Wallet } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { useDemo } from '../../context/DemoContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { feeFor } from '../../utils/fees';
import { formatSnPhone, isSnMobile } from '../../utils/validators';
import { findService, servicesIn } from '../../data/catalog';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, ChoiceGrid, FeeSummary, Field, ReviewView, Segmented, parseAmount } from '../ui';

const WALLETS = servicesIn('mobile_money');

/** Code de retrait à 6 chiffres, présenté « 123 456 ». */
const newCode = () => String(Math.floor(100000 + Math.random() * 900000)).replace(/(\d{3})(\d{3})/, '$1 $2');

export const WithdrawModal: React.FC = () => {
  const { announce } = useDemo();
  const { setActiveModal, modalParams, currency, balance, user, addTransaction, showToast } = useBanking();
  const preset = findService(modalParams.provider);
  const [mode, setMode] = useState<'wallet' | 'agent'>('wallet');
  const [wallet, setWallet] = useState(preset?.category === 'mobile_money' ? preset.id : WALLETS[0].id);
  const [phone, setPhone] = useState(user.phone);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'review' | 'done'>('form');
  const [showErrors, setShowErrors] = useState(false);
  const [code] = useState(newCode);

  const close = () => setActiveModal(null);
  const value = parseAmount(amount);
  const fee = feeFor(value);
  const walletName = WALLETS.find((w) => w.id === wallet)?.name ?? wallet;
  const errors = {
    phone: mode === 'wallet' && !isSnMobile(phone) && 'Numéro sénégalais à 9 chiffres (ex. 77 123 45 67)',
    amount: !(value > 0) ? 'Entrez un montant' : value + fee > balance ? 'Solde insuffisant (frais compris)' : false,
  };
  const valid = !errors.phone && !errors.amount;
  const number = formatSnPhone(phone);
  const expires = new Date(Date.now() + 86_400_000).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const execute = () => {
    const tx = addTransaction({
      title: mode === 'agent' ? 'Retrait chez un agent' : `Retrait vers ${walletName}`,
      subtitle: mode === 'agent' ? `Code ${code} · valable 24 h` : number,
      category: 'Revenus & Virements',
      type: 'withdrawal',
      amount: -value,
      status: 'completed',
      icon: 'Banknote',
      brandLogo: mode === 'wallet' ? wallet : 'payzed',
      recipient: mode === 'agent' ? `Agent Payzed · code ${code}` : `${walletName} · ${number}`,
      fee,
      paymentMethod: mode === 'agent' ? 'Agent Payzed' : walletName,
      code: mode === 'agent' ? code : undefined,
    });
    announce(tx, balance - (value + fee));
    triggerSuccessConfetti();
    setStep('done');
  };

  if (step === 'done') {
    return (
      <Sheet title="Retrait effectué" onClose={close}>
        <div className="text-center pt-2">
          <p className="text-[32px] font-extrabold tracking-tight">{formatCurrency(value, currency)}</p>
          {mode === 'agent' ? (
            <>
              <p className="text-[15px] text-neutral-500 mt-1">Présentez ce code à un agent Payzed</p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(code.replace(' ', ''));
                    showToast('Code copié');
                  } catch {
                    showToast('Copie impossible');
                  }
                }}
                className="mt-5 w-full rounded-3xl bg-black text-white py-6 active:scale-[0.98] transition-transform"
              >
                <span className="block text-[40px] font-extrabold tracking-[0.15em] tabular-nums">{code}</span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-white/70">
                  <Copy className="w-3.5 h-3.5" /> Toucher pour copier · valable jusqu'au {expires}
                </span>
              </button>
              <p className="text-[13px] text-neutral-500 mt-3">Ne communiquez ce code qu'à l'agent, au moment du retrait.</p>
            </>
          ) : (
            <p className="text-[15px] text-neutral-500 mt-1">
              envoyés vers {walletName} · {number}
            </p>
          )}
          <Button className="w-full mt-8" onClick={close}>
            Terminé
          </Button>
        </div>
      </Sheet>
    );
  }

  if (step === 'review') {
    return (
      <Sheet title="Vérifier le retrait" onClose={close} onBack={() => setStep('form')} confirmClose>
        <ReviewView
          caption="Vous allez retirer"
          amount={formatCurrency(value, currency)}
          rows={[
            ['Retrait', mode === 'agent' ? 'Chez un agent (code)' : walletName],
            ...(mode === 'wallet' ? ([['Numéro', number]] as [string, string][]) : []),
            ['Frais (1 %)', formatCurrency(fee, currency)],
            ['Total débité', <strong key="t">{formatCurrency(value + fee, currency)}</strong>],
          ]}
          confirmLabel="Confirmer le retrait"
          onConfirm={execute}
          onEdit={() => setStep('form')}
        />
      </Sheet>
    );
  }

  return (
    <Sheet
      title="Retirer de l'argent"
      onClose={close}
      confirmClose={Boolean(amount)}
      footer={
        <Button type="submit" form="withdraw-form" className="w-full">
          Continuer
        </Button>
      }
    >
      <form
        id="withdraw-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setShowErrors(true);
          if (valid) setStep('review');
        }}
        className="space-y-5"
      >
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { id: 'wallet', label: 'Vers Mobile Money' },
            { id: 'agent', label: 'Chez un agent' },
          ]}
        />
        {mode === 'wallet' ? (
          <>
            <ChoiceGrid
              columns={Math.min(4, WALLETS.length)}
              value={wallet}
              onChange={setWallet}
              options={WALLETS.map((w) => ({ id: w.id, label: w.name, icon: <BrandLogo brand={w.id} size={32} className="rounded-lg" /> }))}
            />
            <Field
              label="Numéro du portefeuille"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="next"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={showErrors && errors.phone}
            />
          </>
        ) : (
          <div className="flex gap-3 rounded-2xl bg-neutral-100 p-4">
            <Store className="w-6 h-6 shrink-0" />
            <p className="text-[15px] text-neutral-700">
              Vous recevrez un <strong>code de retrait</strong> valable 24 h. Présentez-le à un agent Payzed pour récupérer l'argent en espèces.
            </p>
          </div>
        )}
        <AmountField
          value={amount}
          onChange={setAmount}
          hint={showErrors && errors.amount ? <span className="text-red-600">{errors.amount}</span> : `Disponible : ${formatCurrency(balance, currency)}`}
        />
        {value > 0 && <FeeSummary amount={value} fee={fee} balance={balance} />}
        {mode === 'wallet' && (
          <p className="flex items-center gap-2 text-[13px] text-neutral-500 px-1">
            <Wallet className="w-4 h-4" /> L'argent arrive sur votre portefeuille {walletName}.
          </p>
        )}
      </form>
    </Sheet>
  );
};
