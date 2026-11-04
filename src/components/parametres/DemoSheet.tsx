import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { DEMO_PLATFORMS, useDemo, type DemoPlatform } from '../../context/DemoContext';
import { formatCurrency } from '../../utils/formatters';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, ChoiceGrid, Field, SectionTitle, Segmented, parseAmount } from '../ui';

const DELAYS = [
  { id: '0', label: 'Direct' },
  { id: '10', label: '10 s' },
  { id: '30', label: '30 s' },
  { id: '60', label: '1 min' },
] as const;
type Delay = (typeof DELAYS)[number]['id'];

const Countdown: React.FC<{ endsAt: number }> = ({ endsAt }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  return <>{Math.max(0, Math.ceil((endsAt - now) / 1000))} s</>;
};

export const DemoSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { balance, setBalanceTo, showToast } = useBanking();
  const { simulate, pending, cancelSimulation } = useDemo();

  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [platform, setPlatform] = useState<DemoPlatform>('wave');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [delay, setDelay] = useState<Delay>('0');
  const [newBalance, setNewBalance] = useState(String(balance));
  // Le champ suit le solde réel (après une simulation, par exemple)
  useEffect(() => {
    setNewBalance(String(balance));
  }, [balance]);

  const value = parseAmount(amount);
  const ready = name.trim().length > 0 && value > 0;
  const balanceValue = parseAmount(newBalance);

  const launch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    if (direction === 'out' && value > balance) return showToast('Solde insuffisant pour cette sortie');
    const delaySeconds = Number(delay);
    simulate({ direction, platform, name, phone, amount: value, delaySeconds });
    setAmount('');
    if (delaySeconds > 0) {
      showToast(`Notification dans ${DELAYS.find((d) => d.id === delay)!.label}`);
      onClose(); // on laisse l'écran libre pour la présentation
    }
  };

  return (
    <Sheet title="Simulations" onClose={onClose}>
      <div className="space-y-8">
        {pending && (
          <div className="flex items-center gap-3 rounded-3xl bg-black text-white p-4">
            <Timer className="w-6 h-6 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold truncate">{pending.label}</p>
              <p className="text-[13px] text-neutral-400">
                Arrive dans <Countdown endsAt={pending.endsAt} />
              </p>
            </div>
            <Button size="md" variant="secondary" className="bg-white/15 text-white" onClick={cancelSimulation}>
              Annuler
            </Button>
          </div>
        )}

        <form onSubmit={launch} className="space-y-5">
          <SectionTitle>Simuler une opération</SectionTitle>
          <Segmented
            value={direction}
            onChange={setDirection}
            options={[
              { id: 'in', label: "Entrée d'argent" },
              { id: 'out', label: "Sortie d'argent" },
            ]}
          />
          <ChoiceGrid
            columns={3}
            value={platform}
            onChange={setPlatform}
            options={DEMO_PLATFORMS.map((p) => ({ id: p.id, label: p.label, icon: <BrandLogo brand={p.id} size={32} className="rounded-lg" /> }))}
          />
          <Field
            label={direction === 'in' ? 'Expéditeur' : 'Bénéficiaire'}
            placeholder="Nom et prénom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
          <Field
            label="Numéro (facultatif)"
            type="tel"
            inputMode="tel"
            placeholder="77 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="off"
          />
          <AmountField value={amount} onChange={setAmount} />
          <div>
            <p className="text-[13px] font-semibold text-neutral-500 mb-1.5 px-1">Arrivée de la notification</p>
            <Segmented value={delay} onChange={setDelay} options={DELAYS.map((d) => ({ id: d.id, label: d.label }))} />
          </div>
          <Button type="submit" className="w-full" disabled={!ready}>
            {direction === 'in' ? "Simuler l'entrée" : 'Simuler la sortie'}
          </Button>
        </form>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setBalanceTo(balanceValue);
            showToast('Solde mis à jour');
          }}
          className="space-y-4"
        >
          <SectionTitle>Solde du compte</SectionTitle>
          <AmountField label="Nouveau solde" value={newBalance} onChange={setNewBalance} hint={`Actuel : ${formatCurrency(balance, 'XOF')}`} />
          <Button type="submit" variant="secondary" className="w-full" disabled={balanceValue === balance}>
            Mettre à jour le solde
          </Button>
        </form>
      </div>
    </Sheet>
  );
};
