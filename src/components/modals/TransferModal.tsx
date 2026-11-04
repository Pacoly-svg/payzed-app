import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';

const RAILS = [
  { id: 'payzed', label: 'Payzed' },
  { id: 'wave', label: 'Wave' },
  { id: 'orange', label: 'Orange Money' },
] as const;

const CONTACTS = [
  { name: 'Fatou Sow', phone: '+221 77 319 88 12' },
  { name: 'Cheikh Ndiaye', phone: '+221 78 440 21 09' },
  { name: 'Aminata Fall', phone: '+221 76 512 34 56' },
  { name: 'Ousmane Ba', phone: '+221 70 890 12 34' },
];

const initials = (n: string) => n.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

export const TransferModal: React.FC = () => {
  const { setActiveModal, currency, balance, addTransaction, showToast } = useBanking();
  const [rail, setRail] = useState<(typeof RAILS)[number]['id']>('payzed');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState<number | null>(null);

  const close = () => setActiveModal(null);
  const railLabel = RAILS.find((r) => r.id === rail)!.label;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Math.round(Number(amount.replace(/\s/g, '')));
    if (!name.trim()) return showToast('Indiquez le bénéficiaire');
    if (!(value > 0)) return showToast('Montant invalide');
    if (value > balance) return showToast('Solde insuffisant');

    addTransaction({
      title: name.trim(),
      subtitle: `Envoi via ${railLabel}`,
      category: 'Revenus & Virements',
      type: 'transfer_out',
      amount: -value,
      status: 'completed',
      icon: 'ArrowUpRight',
      brandLogo: rail === 'payzed' ? undefined : rail,
      recipient: phone.trim() ? `${name.trim()} (${phone.trim()})` : name.trim(),
      recipientPhone: phone.trim() || undefined,
      fee: 0,
      paymentMethod: railLabel,
    });
    triggerSuccessConfetti();
    setDone(value);
  };

  if (done !== null) {
    return (
      <Sheet title="Envoi effectué" onClose={close}>
        <div className="py-6 text-center space-y-3">
          <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-600" />
          <p className="text-2xl font-extrabold">{formatCurrency(done, currency)}</p>
          <p className="text-sm text-neutral-500">envoyés à {name.trim()} via {railLabel}</p>
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
    <Sheet title="Envoyer de l'argent" onClose={close}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
          {CONTACTS.map((c) => (
            <button
              key={c.phone}
              type="button"
              onClick={() => {
                setName(c.name);
                setPhone(c.phone);
              }}
              className="flex flex-col items-center gap-1 shrink-0 w-16 active:scale-95"
            >
              <span
                className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm ${
                  name === c.name ? 'bg-black text-white' : 'bg-neutral-100'
                }`}
              >
                {initials(c.name)}
              </span>
              <span className="text-xs font-medium truncate w-full text-center">{c.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {RAILS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRail(r.id)}
              className={`py-2.5 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 ${
                rail === r.id ? 'border-black bg-neutral-50' : 'border-neutral-200'
              }`}
            >
              {r.id === 'payzed' ? (
                <span className="w-7 h-7 rounded-lg bg-black flex items-center justify-center p-1.5">
                  <img src="/assets/logo/symbole-blanc.svg" alt="" className="w-full h-full" />
                </span>
              ) : (
                <BrandLogo brand={r.id} size={28} className="rounded-lg" />
              )}
              {r.label}
            </button>
          ))}
        </div>

        <input className={field} placeholder="Nom du bénéficiaire" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          className={field}
          type="tel"
          inputMode="tel"
          placeholder="Numéro (ex : 77 123 45 67)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
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
          Envoyer
        </button>
      </form>
    </Sheet>
  );
};
