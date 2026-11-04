import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Plus, Timer } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { DEMO_PLATFORMS, useDemo } from '../../context/DemoContext';
import { formatCurrency } from '../../utils/formatters';
import { feeFor } from '../../utils/fees';
import { resizeImage } from '../../utils/image';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, ChoiceGrid, FeeSummary, Field, SectionTitle, Segmented, TextLink, parseAmount } from '../ui';

const DELAYS = [
  { id: '0', label: 'Direct' },
  { id: '10', label: '10 s' },
  { id: '30', label: '30 s' },
  { id: '60', label: '1 min' },
] as const;
type Delay = (typeof DELAYS)[number]['id'];

/** Valeur pour <input type="datetime-local"> à l'heure locale. */
const toLocalInput = (ts: number) => {
  const d = new Date(ts);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const Countdown: React.FC<{ endsAt: number }> = ({ endsAt }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  return <>{Math.max(0, Math.ceil((endsAt - now) / 1000))} s</>;
};

/* ---------- Ajout d'un canal personnalisé ---------- */

const NewChannel: React.FC<{ onBack: () => void; onClose: () => void; onCreated: (id: string) => void }> = ({ onBack, onClose, onCreated }) => {
  const { addCustomPlatform } = useDemo();
  const { showToast } = useBanking();
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setLogo(await resizeImage(file, 160, 'image/png'));
    } catch {
      showToast("Impossible de lire l'image");
    }
  };

  return (
    <Sheet title="Nouveau canal" onBack={onBack} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !logo) return;
          onCreated(addCustomPlatform(name, logo));
        }}
        className="space-y-5"
      >
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mx-auto w-24 h-24 rounded-3xl bg-neutral-100 flex flex-col items-center justify-center gap-1 overflow-hidden active:scale-95 transition-transform"
        >
          {logo ? (
            <img src={logo} alt="" className="w-full h-full object-contain p-2" />
          ) : (
            <>
              <ImagePlus className="w-7 h-7" />
              <span className="text-[12px] font-semibold text-neutral-500">Logo</span>
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
        <Field label="Nom du canal" placeholder="Ex : Free Money, BICIS, UBA" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
        <Button type="submit" className="w-full" disabled={!name.trim() || !logo}>
          Ajouter le canal
        </Button>
      </form>
    </Sheet>
  );
};

/* ---------- SIM ---------- */

export const DemoSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { balance, setBalanceTo, showToast } = useBanking();
  const { simulate, pending, cancelSimulation, customPlatforms, removeCustomPlatform } = useDemo();

  const [view, setView] = useState<'main' | 'channel'>('main');
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [platform, setPlatform] = useState<string>('wave');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [when, setWhen] = useState<'now' | 'date'>('now');
  const [date, setDate] = useState(() => toLocalInput(Date.now() - 86_400_000));
  const [delay, setDelay] = useState<Delay>('0');
  const [newBalance, setNewBalance] = useState(String(balance));

  // Le champ suit le solde réel (après une simulation, par exemple)
  useEffect(() => {
    setNewBalance(String(balance));
  }, [balance]);

  if (view === 'channel') {
    return (
      <NewChannel
        onBack={() => setView('main')}
        onClose={onClose}
        onCreated={(id) => {
          setPlatform(id);
          setView('main');
        }}
      />
    );
  }

  const value = parseAmount(amount);
  const fee = direction === 'out' ? feeFor(value) : 0;
  const dateTs = when === 'date' ? new Date(date).getTime() : undefined;
  const dateValid = when === 'now' || (Number.isFinite(dateTs) && (dateTs as number) <= Date.now());
  const ready = name.trim().length > 0 && value > 0 && dateValid && (direction === 'in' || value + fee <= balance);
  const balanceValue = parseAmount(newBalance);
  const isCustom = platform.startsWith('custom_');

  const launch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    const delaySeconds = when === 'now' ? Number(delay) : 0;
    simulate({ direction, platform, name, phone, amount: value, delaySeconds, timestamp: dateTs });
    setAmount('');
    if (delaySeconds > 0) {
      showToast(`Notification dans ${DELAYS.find((d) => d.id === delay)!.label}`);
      onClose(); // on laisse l'écran libre pour la présentation
    }
  };

  const options = [
    ...DEMO_PLATFORMS.map((p) => ({ id: p.id as string, label: p.label, icon: <BrandLogo brand={p.id} size={32} className="rounded-lg" /> })),
    ...customPlatforms.map((p) => ({ id: p.id, label: p.name, icon: <BrandLogo brand={p.logo} size={32} className="rounded-lg" /> })),
  ];

  return (
    <Sheet title="SIM" onClose={onClose}>
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

          <div className="space-y-2">
            <ChoiceGrid columns={3} value={platform} onChange={setPlatform} options={options} />
            <div className="flex items-center justify-between">
              <TextLink className="flex items-center gap-1.5" onClick={() => setView('channel')}>
                <Plus className="w-4 h-4" /> Ajouter un canal
              </TextLink>
              {isCustom && (
                <TextLink
                  className="text-red-600"
                  onClick={() => {
                    removeCustomPlatform(platform);
                    setPlatform('wave');
                  }}
                >
                  Supprimer ce canal
                </TextLink>
              )}
            </div>
          </div>

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
          {direction === 'out' && value > 0 && <FeeSummary amount={value} fee={fee} balance={balance} />}

          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-neutral-500 px-1">Date de l'opération</p>
            <Segmented
              value={when}
              onChange={setWhen}
              options={[
                { id: 'now', label: 'Maintenant' },
                { id: 'date', label: 'Autre date' },
              ]}
            />
            {when === 'date' ? (
              <Field
                type="datetime-local"
                value={date}
                max={toLocalInput(Date.now())}
                onChange={(e) => setDate(e.target.value)}
                hint={dateValid ? "Ajoutée directement à l'historique, sans notification." : 'Choisissez une date passée.'}
              />
            ) : (
              <div>
                <p className="text-[13px] font-semibold text-neutral-500 mb-1.5 px-1">Arrivée de la notification</p>
                <Segmented value={delay} onChange={setDelay} options={DELAYS.map((d) => ({ id: d.id, label: d.label }))} />
              </div>
            )}
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
