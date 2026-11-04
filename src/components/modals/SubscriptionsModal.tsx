import React, { useState } from 'react';
import { Plus, Repeat } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, ChoiceGrid, EmptyState, Field, List, Row, parseAmount } from '../ui';
import type { SubscriptionItem } from '../../types/banking';

type View = { name: 'list' } | { name: 'detail'; id: string } | { name: 'add' };

const SERVICES = [
  { id: 'spotify', label: 'Spotify', amount: 3500 },
  { id: 'netflix', label: 'Netflix', amount: 6500 },
  { id: 'chatgpt', label: 'ChatGPT', amount: 13000 },
  { id: 'claude', label: 'Claude', amount: 13000 },
  { id: 'gemini', label: 'Gemini', amount: 13000 },
  { id: 'autre', label: 'Autre', amount: 0 },
] as const;
type ServiceId = (typeof SERVICES)[number]['id'];

const nextMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const SubscriptionsModal: React.FC = () => {
  const { setActiveModal, subscriptions } = useBanking();
  const [view, setView] = useState<View>({ name: 'list' });
  const close = () => setActiveModal(null);
  const back = () => setView({ name: 'list' });

  if (view.name === 'detail') {
    const sub = subscriptions.find((s) => s.id === view.id);
    if (sub) return <SubscriptionDetail sub={sub} onBack={back} onClose={close} />;
  }
  if (view.name === 'add') return <SubscriptionAdd onBack={back} onClose={close} />;

  const active = subscriptions.filter((s) => s.status === 'active');
  const monthly = active.reduce((sum, s) => sum + (s.billingCycle === 'yearly' ? Math.round(s.amount / 12) : s.amount), 0);

  return (
    <Sheet title="Abonnements" onClose={close}>
      <div className="space-y-5">
        <div className="rounded-3xl bg-black text-white p-5">
          <p className="text-[13px] text-neutral-400 font-medium">Chaque mois</p>
          <p className="text-[30px] font-extrabold tracking-tight mt-0.5">{formatCurrency(monthly, 'XOF')}</p>
          <p className="text-[13px] text-neutral-400 mt-0.5">
            {active.length} abonnement{active.length > 1 ? 's' : ''} actif{active.length > 1 ? 's' : ''}
          </p>
        </div>

        {subscriptions.length === 0 ? (
          <EmptyState icon={<Repeat className="w-6 h-6" />} title="Aucun abonnement" />
        ) : (
          <List>
            {subscriptions.map((s) => (
              <Row
                key={s.id}
                onClick={() => setView({ name: 'detail', id: s.id })}
                icon={<BrandLogo brand={s.name} size={44} className="rounded-2xl" />}
                title={s.name}
                subtitle={s.status === 'active' ? `Le ${s.nextBillingDate}` : 'En pause'}
                trailing={
                  <span className={`text-[15px] font-bold whitespace-nowrap shrink-0 ${s.status === 'paused' ? 'text-neutral-400 line-through' : ''}`}>
                    {formatCurrency(s.amount, 'XOF')}
                  </span>
                }
              />
            ))}
          </List>
        )}

        <Button variant="secondary" className="w-full" icon={<Plus className="w-5 h-5" />} onClick={() => setView({ name: 'add' })}>
          Ajouter un abonnement
        </Button>
      </div>
    </Sheet>
  );
};

const SubscriptionDetail: React.FC<{ sub: SubscriptionItem; onBack: () => void; onClose: () => void }> = ({ sub, onBack, onClose }) => {
  const { toggleSubscription, removeSubscription, addTransaction, balance, showToast } = useBanking();
  const paused = sub.status === 'paused';

  const payNow = () => {
    if (sub.amount > balance) return showToast('Solde insuffisant');
    addTransaction({
      title: sub.name,
      subtitle: 'Abonnement',
      category: 'Services & Abonnements',
      type: 'subscription',
      amount: -sub.amount,
      status: 'completed',
      icon: 'Tv',
      brandLogo: sub.name,
      recipient: sub.provider || sub.name,
      fee: 0,
      paymentMethod: 'Carte Payzed',
    });
    showToast(`${sub.name} payé`);
  };

  return (
    <Sheet title={sub.name} onBack={onBack} onClose={onClose}>
      <div className="space-y-6">
        <div className="text-center pt-1">
          <BrandLogo brand={sub.name} size={64} className="rounded-3xl mx-auto" />
          <p className="mt-4 text-[32px] font-extrabold tracking-tight">{formatCurrency(sub.amount, 'XOF')}</p>
          <p className="text-[15px] text-neutral-500">par {sub.billingCycle === 'yearly' ? 'an' : 'mois'}</p>
        </div>

        <List>
          <Row title="Statut" trailing={<span className="text-[15px] font-semibold">{paused ? 'En pause' : 'Actif'}</span>} />
          {!paused && <Row title="Prochain prélèvement" trailing={<span className="text-[15px] font-semibold">{sub.nextBillingDate}</span>} />}
        </List>

        <div className="space-y-2">
          {!paused && (
            <Button className="w-full" onClick={payNow}>
              Payer maintenant
            </Button>
          )}
          <Button variant="secondary" className="w-full" onClick={() => toggleSubscription(sub.id)}>
            {paused ? "Réactiver l'abonnement" : 'Mettre en pause'}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-red-600"
            onClick={() => {
              removeSubscription(sub.id);
              showToast('Abonnement supprimé');
              onBack();
            }}
          >
            Supprimer
          </Button>
        </div>
      </div>
    </Sheet>
  );
};

const SubscriptionAdd: React.FC<{ onBack: () => void; onClose: () => void }> = ({ onBack, onClose }) => {
  const { addSubscription, showToast } = useBanking();
  const [service, setService] = useState<ServiceId>('spotify');
  const [name, setName] = useState('Spotify');
  const [amount, setAmount] = useState('3500');
  const value = parseAmount(amount);
  const ready = name.trim().length > 0 && value > 0;

  const pick = (id: ServiceId) => {
    const s = SERVICES.find((x) => x.id === id)!;
    setService(id);
    setName(id === 'autre' ? '' : s.label);
    setAmount(s.amount ? String(s.amount) : '');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    addSubscription({
      name: name.trim(),
      provider: name.trim(),
      amount: value,
      currency: 'XOF',
      billingCycle: 'monthly',
      nextBillingDate: nextMonth(),
      category: 'Abonnements',
      status: 'active',
      iconName: 'Tv',
    });
    showToast('Abonnement ajouté');
    onBack();
  };

  return (
    <Sheet title="Nouvel abonnement" onBack={onBack} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <ChoiceGrid
          columns={3}
          value={service}
          onChange={pick}
          options={SERVICES.map((s) => ({
            id: s.id,
            label: s.label,
            icon:
              s.id === 'autre' ? (
                <span className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </span>
              ) : (
                <BrandLogo brand={s.id} size={32} className="rounded-lg" />
              ),
          }))}
        />
        <Field label="Nom" placeholder="Ex : Canal+, salle de sport" value={name} onChange={(e) => setName(e.target.value)} />
        <AmountField label="Montant par mois" value={amount} onChange={setAmount} />
        <Button type="submit" className="w-full" disabled={!ready}>
          Ajouter
        </Button>
      </form>
    </Sheet>
  );
};
