/* eslint-disable react-refresh/only-export-components */
import React, { useMemo, useState } from 'react';
import { Banknote, Car, ChevronRight, Droplets, FileText, Globe, Landmark, Repeat, Search, ShieldCheck, Smartphone, Tv, Wallet, Wifi, X, Zap } from 'lucide-react';
import { useBanking, type ModalType } from '../../context/BankingContext';
import { CATEGORIES, SERVICE_OPERATORS, categoryOf, findOperator, searchServices, servicesOf, type Category, type Operator, type Service } from '../../data/catalog';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { EmptyState, List, Row, Segmented, TextLink } from '../ui';

export const CATEGORY_ICONS: Record<Category['icon'], React.ElementType> = {
  Wallet,
  Landmark,
  Globe,
  Smartphone,
  Zap,
  Droplets,
  Wifi,
  Tv,
  Car,
  FileText,
  ShieldCheck,
  Repeat,
};

/** Parcours à ouvrir pour un service. */
export function modalFor(s: Service): ModalType {
  switch (categoryOf(s.category).action) {
    case 'transfer':
      return 'transfer';
    case 'topup':
      return 'topup';
    case 'bill':
      return 'bills';
    default:
      return 'subscriptions';
  }
}

/** Libellé d'action lisible (« Payer la facture », « Envoyer », …). */
const actionLabel = (s: Service) =>
  ({ transfer: 'Envoyer', topup: 'Acheter du crédit', bill: 'Payer une facture', subscription: "S'abonner" })[categoryOf(s.category).action];

const ServiceTile: React.FC<{ s: Service; onPick: (s: Service) => void }> = ({ s, onPick }) => (
  <button type="button" onClick={() => onPick(s)} className="flex flex-col items-center gap-2 min-w-0 py-1 active:scale-95 transition-transform">
    <BrandLogo brand={s.id} size={52} />
    <span className="text-[12px] font-semibold leading-tight text-center line-clamp-2 w-full">{s.name}</span>
  </button>
);

const SearchBox: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <label className="flex items-center gap-3 h-12 px-4 rounded-2xl bg-neutral-100 border-2 border-transparent focus-within:border-black focus-within:bg-white transition-colors">
    <Search className="w-5 h-5 text-neutral-400 shrink-0" />
    <input
      type="search"
      enterKeyHint="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Rechercher un service ou un opérateur"
      className="flex-1 min-w-0 bg-transparent text-[16px] font-medium placeholder:text-neutral-400 focus:outline-none"
      autoComplete="off"
    />
    {value && (
      <button type="button" aria-label="Effacer la recherche" onClick={() => onChange('')} className="w-8 h-8 -mr-2 rounded-full flex items-center justify-center">
        <X className="w-4 h-4" />
      </button>
    )}
  </label>
);

export const ServicesModal: React.FC = () => {
  const { setActiveModal } = useBanking();
  const [view, setView] = useState<'service' | 'operator'>('service');
  const [query, setQuery] = useState('');
  const [operator, setOperator] = useState<Operator | null>(null);
  const close = () => setActiveModal(null);
  const pick = (s: Service) => setActiveModal(modalFor(s), { provider: s.id });

  const results = useMemo(() => searchServices(query), [query]);

  /* ----- Fiche d'un opérateur : tous ses services ----- */
  if (operator) {
    const items = servicesOf(operator.id);
    return (
      <Sheet title={operator.name} onBack={() => setOperator(null)} onClose={close}>
        <div className="flex flex-col items-center text-center pb-5">
          <BrandLogo brand={items[0]?.id ?? operator.id} size={72} className="rounded-3xl" />
          <p className="mt-3 text-[15px] text-neutral-500">
            {items.length} service{items.length > 1 ? 's' : ''} disponible{items.length > 1 ? 's' : ''}
          </p>
        </div>
        <List>
          {items.flatMap((s) => {
            const Icon = CATEGORY_ICONS[categoryOf(s.category).icon];
            const rows = [
              <Row
                key={s.id}
                onClick={() => pick(s)}
                icon={<BrandLogo brand={s.id} size={44} />}
                title={s.name}
                subtitle={
                  <span className="inline-flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5" /> {categoryOf(s.category).label} · {actionLabel(s)}
                  </span>
                }
                trailing={<ChevronRight className="w-5 h-5 text-neutral-400" />}
              />,
            ];
            // Un portefeuille Mobile Money permet aussi de retirer
            if (s.category === 'mobile_money')
              rows.push(
                <Row
                  key={`${s.id}-withdraw`}
                  onClick={() => setActiveModal('withdraw', { provider: s.id })}
                  icon={<BrandLogo brand={s.id} size={44} />}
                  title={`Retirer vers ${s.name}`}
                  subtitle={
                    <span className="inline-flex items-center gap-1">
                      <Banknote className="w-3.5 h-3.5" /> Mobile Money · Retrait
                    </span>
                  }
                  trailing={<ChevronRight className="w-5 h-5 text-neutral-400" />}
                />,
              );
            return rows;
          })}
        </List>
      </Sheet>
    );
  }

  /* ----- Vue principale ----- */
  const groups = CATEGORIES.map((c) => ({ c, items: results.filter((s) => s.category === c.id) })).filter((g) => g.items.length > 0);
  const operators = query ? SERVICE_OPERATORS.filter((o) => results.some((s) => s.operatorId === o.id)) : SERVICE_OPERATORS;

  return (
    <Sheet title="Tous les services" onClose={close}>
      <div className="space-y-5">
        <SearchBox value={query} onChange={setQuery} />
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { id: 'service', label: 'Par service' },
            { id: 'operator', label: 'Par opérateur' },
          ]}
        />

        {results.length === 0 ? (
          <EmptyState icon={<Search className="w-6 h-6" />} title="Aucun résultat" text="Vérifiez l'orthographe ou essayez le nom de l'opérateur." />
        ) : view === 'service' ? (
          groups.map(({ c, items }) => {
            const Icon = CATEGORY_ICONS[c.icon];
            return (
              <section key={c.id} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-[15px] font-bold">
                    <Icon className="w-4 h-4" /> {c.label}
                  </h3>
                  {c.id === 'subscriptions' && <TextLink onClick={() => setActiveModal('subscriptions')}>Mes abonnements</TextLink>}
                </div>
                <div className="grid grid-cols-4 gap-x-2 gap-y-3">
                  {items.map((s) => (
                    <ServiceTile key={s.id} s={s} onPick={pick} />
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <List>
            {operators.map((o) => {
              const items = servicesOf(o.id);
              return (
                <Row
                  key={o.id}
                  onClick={() => setOperator(findOperator(o.id) ?? o)}
                  icon={<BrandLogo brand={items[0]?.id ?? o.id} size={44} />}
                  title={o.name}
                  subtitle={items.map((s) => s.name).join(' · ')}
                  trailing={<ChevronRight className="w-5 h-5 text-neutral-400" />}
                />
              );
            })}
          </List>
        )}
      </div>
    </Sheet>
  );
};
