import React, { useEffect, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Banknote, ImagePlus, Landmark, Plus, ShoppingBag } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { SIM_CATEGORIES, isOutgoing, useDemo, type SimKind } from '../../context/DemoContext';
import { MERCHANTS, categoryOf, findService, servicesIn, type CategoryId } from '../../data/catalog';
import { formatCurrency } from '../../utils/formatters';
import { feeFor } from '../../utils/fees';
import { resizeImage } from '../../utils/image';
import { exactAlarmsAllowed, openExactAlarmSettings } from '../../utils/notify';
import { STATUS_LABEL, formatDuration } from '../../utils/status';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, ChoiceGrid, FeeSummary, Field, List, SectionTitle, Segmented, TextLink, parseAmount } from '../ui';

const KINDS: { id: SimKind; label: string; icon: React.ElementType }[] = [
  { id: 'in', label: 'Entrée', icon: ArrowDownLeft },
  { id: 'deposit', label: 'Dépôt', icon: Landmark },
  { id: 'out', label: 'Envoi', icon: ArrowUpRight },
  { id: 'withdrawal', label: 'Retrait', icon: Banknote },
  { id: 'purchase', label: 'Achat', icon: ShoppingBag },
];

const UNITS = [
  { id: 's', ms: 1000 },
  { id: 'min', ms: 60_000 },
  { id: 'h', ms: 3_600_000 },
  { id: 'j', ms: 86_400_000 },
] as const;
type Unit = (typeof UNITS)[number]['id'];

/** Valeur pour <input type="datetime-local"> à l'heure locale. */
const toLocalInput = (ts: number) => {
  const d = new Date(ts);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const fullDate = (ts: number) => new Date(ts).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Re-rendu toutes les secondes (comptes à rebours). */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

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
  const { balance, setBalanceTo, showToast, user, setSelectedTransaction } = useBanking();
  const { simulate, activeSims, cancelSim, purgeSims, customPlatforms, removeCustomPlatform } = useDemo();

  const [view, setView] = useState<'main' | 'channel' | 'purge'>('main');
  const [kind, setKind] = useState<SimKind>('in');
  const [merchant, setMerchant] = useState<string>(MERCHANTS[0].id);
  const [platform, setPlatform] = useState<string>('wave');
  const [group, setGroup] = useState<CategoryId | 'custom'>('mobile_money');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [when, setWhen] = useState<'now' | 'date'>('now');
  const [date, setDate] = useState(() => toLocalInput(Date.now() - 86_400_000));
  const [delay, setDelay] = useState('0');
  const [unit, setUnit] = useState<Unit>('min');
  const [outcome, setOutcome] = useState<'completed' | 'failed'>('completed');
  const [newBalance, setNewBalance] = useState(String(balance));
  const now = useNow(activeSims.length > 0);
  // Android : sans « alarmes exactes », une notification programmée peut arriver avec quelques minutes de retard
  const [exactAlarms, setExactAlarms] = useState<boolean | null>(null);
  useEffect(() => {
    void exactAlarmsAllowed().then(setExactAlarms);
  }, []);

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
          setGroup('custom');
          setView('main');
        }}
      />
    );
  }

  if (view === 'purge') {
    return (
      <Sheet title="Effacer les opérations SIM ?" onBack={() => setView('main')} onClose={onClose}>
        <p className="text-[15px] text-neutral-600">
          Toutes les opérations créées dans SIM seront supprimées de l'historique et leurs effets sur le solde annulés. Les autres opérations ne
          sont pas touchées.
        </p>
        <div className="space-y-2 mt-6">
          <Button
            className="w-full bg-red-600"
            onClick={() => {
              const n = purgeSims();
              showToast(n ? `${n} opération${n > 1 ? 's' : ''} SIM effacée${n > 1 ? 's' : ''}` : 'Aucune opération SIM');
              setView('main');
            }}
          >
            Tout effacer
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => setView('main')}>
            Annuler
          </Button>
        </div>
      </Sheet>
    );
  }

  const outgoing = isOutgoing(kind);
  const needsName = kind === 'in' || kind === 'out';
  const value = parseAmount(amount);
  const fee = outgoing ? feeFor(value) : 0;
  const delayValue = Number(delay.replace(',', '.')) || 0;
  const delayMs = Math.round(delayValue * UNITS.find((u) => u.id === unit)!.ms);
  const dateTs = when === 'date' ? new Date(date).getTime() : undefined;
  const dateValid = when === 'now' || (Number.isFinite(dateTs) && (dateTs as number) <= Date.now());
  const delayValid = delayValue >= 0 && delayMs <= 365 * 86_400_000;
  const scheduledLaunch = when === 'now' && delayMs > 0;
  const ready =
    (!needsName || name.trim().length > 0) &&
    value > 0 &&
    dateValid &&
    delayValid &&
    (!outgoing || outcome === 'failed' || scheduledLaunch || value + fee <= balance);

  const launch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    const error = simulate({
      kind,
      platform: kind === 'purchase' ? merchant : platform,
      name: needsName ? name : name.trim() || user.name,
      phone,
      amount: value,
      delayMs: when === 'now' ? delayMs : 0,
      outcome,
      timestamp: dateTs,
    });
    if (error) return showToast(error);
    setAmount('');
    if (scheduledLaunch) showToast(`Programmée · arrivée le ${fullDate(Date.now() + delayMs)}`);
  };

  const groupIds =
    group === 'custom' ? customPlatforms.map((p) => p.id) : [...(group === 'mobile_money' ? ['payzed'] : []), ...servicesIn(group).map((p) => p.id)];
  const options = groupIds.map((id) => {
    const custom = customPlatforms.find((p) => p.id === id);
    return {
      id,
      label: custom?.name ?? (id === 'payzed' ? 'Payzed' : findService(id)?.name ?? id),
      icon: <BrandLogo brand={custom?.logo ?? id} size={32} className="rounded-lg" />,
    };
  });
  const groups: { id: CategoryId | 'custom'; label: string }[] = [
    ...SIM_CATEGORIES.map((c) => ({ id: c, label: categoryOf(c).label })),
    ...(customPlatforms.length ? [{ id: 'custom' as const, label: 'Mes canaux' }] : []),
  ];

  return (
    <Sheet title="SIM" onClose={onClose} confirmClose={Boolean(name || amount)}>
      <div className="space-y-8">
        <p className="rounded-2xl bg-neutral-100 px-4 py-3 text-[13px] text-neutral-600">
          Simulations uniquement : aucune somme réelle n'est déplacée. Chaque opération créée ici est marquée « simulée » et peut être effacée.
        </p>

        {activeSims.length > 0 && (
          <section className="space-y-3">
            <SectionTitle>Programmées ({activeSims.length})</SectionTitle>
            <p className="text-[13px] text-neutral-500 -mt-1">Invisibles dans l'historique jusqu'à leur arrivée.</p>
            <List>
              {activeSims.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                  <button type="button" onClick={() => setSelectedTransaction(t)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <BrandLogo brand={t.brandLogo ?? 'payzed'} size={40} />
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold truncate">
                        {t.title} · {formatCurrency(t.amount, 'XOF', { showSign: true })}
                      </span>
                      <span className="block text-[13px] text-neutral-500">
                        {STATUS_LABEL[t.status]} · arrive dans {formatDuration((t.sim?.resolveAt ?? now) - now)}
                      </span>
                    </span>
                  </button>
                  <Button size="md" variant="secondary" className="bg-white px-4" onClick={() => cancelSim(t.id)}>
                    Annuler
                  </Button>
                </div>
              ))}
            </List>
          </section>
        )}

        <form onSubmit={launch} className="space-y-5">
          <SectionTitle>Nouvelle simulation</SectionTitle>
          <div className="grid grid-cols-5 gap-1.5">
            {KINDS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={kind === id}
                onClick={() => setKind(id)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl text-[12px] font-bold transition-colors ${
                  kind === id ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>

          {kind === 'purchase' ? (
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-neutral-500 px-1">Commerçant</p>
              <ChoiceGrid
                columns={3}
                value={merchant}
                onChange={setMerchant}
                options={MERCHANTS.map((m) => ({ id: m.id, label: m.name, icon: <BrandLogo brand={m.id} size={32} className="rounded-lg" /> }))}
              />
            </div>
          ) : (
          <div className="space-y-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGroup(g.id)}
                  className={`h-9 px-4 rounded-full text-sm font-bold shrink-0 transition-colors ${group === g.id ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-700'}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <ChoiceGrid columns={3} value={platform} onChange={setPlatform} options={options} />
            <div className="flex items-center justify-between">
              <TextLink className="flex items-center gap-1.5" onClick={() => setView('channel')}>
                <Plus className="w-4 h-4" /> Ajouter un canal
              </TextLink>
              {platform.startsWith('custom_') && (
                <TextLink
                  className="text-red-600"
                  onClick={() => {
                    removeCustomPlatform(platform);
                    setPlatform('wave');
                    setGroup('mobile_money');
                  }}
                >
                  Supprimer ce canal
                </TextLink>
              )}
            </div>
          </div>
          )}

          {needsName && (
            <>
              <Field
                label={kind === 'in' ? 'Expéditeur' : 'Bénéficiaire'}
                placeholder="Nom et prénom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                enterKeyHint="next"
              />
              <Field
                label="Numéro (facultatif)"
                type="tel"
                inputMode="tel"
                placeholder="77 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="off"
                enterKeyHint="next"
              />
            </>
          )}
          <AmountField value={amount} onChange={setAmount} />
          {outgoing && value > 0 && <FeeSummary amount={value} fee={fee} balance={balance} />}

          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-neutral-500 px-1">Date de l'opération</p>
            <Segmented
              value={when}
              onChange={setWhen}
              options={[
                { id: 'now', label: 'Maintenant' },
                { id: 'date', label: 'Date passée' },
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
              <>
                <p className="text-[13px] font-semibold text-neutral-500 px-1 pt-1">Durée de traitement</p>
                <div className="flex gap-2">
                  <input
                    inputMode="decimal"
                    enterKeyHint="done"
                    value={delay}
                    onChange={(e) => setDelay(e.target.value.replace(/[^\d.,]/g, '').slice(0, 6))}
                    aria-label="Durée de traitement"
                    className="w-24 h-14 px-4 rounded-2xl bg-neutral-100 border-2 border-transparent text-[18px] font-bold text-center focus:outline-none focus:border-black focus:bg-white"
                  />
                  <div className="flex-1 min-w-0 self-center">
                    <Segmented value={unit} onChange={setUnit} options={UNITS.map((u) => ({ id: u.id, label: u.id }))} />
                  </div>
                </div>
                {delayMs > 0 && exactAlarms === false && (
                  <button
                    type="button"
                    onClick={() => void openExactAlarmSettings().then(() => exactAlarmsAllowed().then(setExactAlarms))}
                    className="w-full text-left rounded-2xl bg-neutral-100 px-4 py-3 text-[13px] text-neutral-700"
                  >
                    Pour une arrivée à la seconde près, autorisez les « Alarmes et rappels » pour Payzed.{' '}
                    <span className="font-bold underline">Autoriser</span>
                  </button>
                )}
                <p className="text-[13px] text-neutral-500 px-1">
                  {delayMs === 0
                    ? 'Immédiat : le résultat est appliqué tout de suite.'
                    : `Invisible dans l'historique jusqu'au ${fullDate(Date.now() + delayMs)} : elle arrivera alors avec une notification, même si l'app est fermée.`}
                </p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[13px] font-semibold text-neutral-500 px-1">Résultat</p>
            <Segmented
              value={outcome}
              onChange={setOutcome}
              options={[
                { id: 'completed', label: 'Réussie' },
                { id: 'failed', label: 'Échouée' },
              ]}
            />
          </div>

          <Button type="submit" className="w-full" disabled={!ready}>
            Lancer la simulation
          </Button>
        </form>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setBalanceTo(parseAmount(newBalance));
            showToast('Solde mis à jour');
          }}
          className="space-y-4"
        >
          <SectionTitle>Solde du compte</SectionTitle>
          <AmountField label="Nouveau solde" value={newBalance} onChange={setNewBalance} hint={`Actuel : ${formatCurrency(balance, 'XOF')}`} />
          <Button type="submit" variant="secondary" className="w-full" disabled={parseAmount(newBalance) === balance}>
            Mettre à jour le solde
          </Button>
        </form>

        <Button variant="ghost" className="w-full text-red-600" onClick={() => setView('purge')}>
          Effacer toutes les opérations SIM
        </Button>
      </div>
    </Sheet>
  );
};
