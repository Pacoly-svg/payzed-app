import React, { useMemo, useState } from 'react';
import { Car, Droplets, FileText, Globe, Landmark, Repeat, Search, ShieldCheck, Smartphone, Tv, Wallet, Wifi, X, Zap } from 'lucide-react';
import { useBanking, type ModalType } from '../../context/BankingContext';
import { CATEGORIES, categoryOf, searchProviders, type Category, type Provider } from '../../data/catalog';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { EmptyState, TextLink } from '../ui';

const ICONS: Record<Category['icon'], React.ElementType> = {
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

/** Ouvre le bon parcours pour un service du catalogue. */
export function modalFor(p: Provider): ModalType {
  switch (categoryOf(p.category).action) {
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

const ProviderTile: React.FC<{ p: Provider; onPick: (p: Provider) => void }> = ({ p, onPick }) => (
  <button type="button" onClick={() => onPick(p)} className="flex flex-col items-center gap-2 min-w-0 active:scale-95 transition-transform">
    <BrandLogo brand={p.id} size={52} className="rounded-2xl" />
    <span className="text-[12px] font-semibold leading-tight text-center line-clamp-2 w-full">{p.name}</span>
  </button>
);

export const ServicesModal: React.FC = () => {
  const { setActiveModal } = useBanking();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Category['id'] | 'all'>('all');
  const close = () => setActiveModal(null);
  const pick = (p: Provider) => setActiveModal(modalFor(p), { provider: p.id });

  const results = useMemo(() => searchProviders(query), [query]);
  const groups = CATEGORIES.filter((c) => filter === 'all' || c.id === filter)
    .map((c) => ({ c, items: results.filter((p) => p.category === c.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <Sheet title="Tous les services" onClose={close}>
      <div className="space-y-5">
        <label className="flex items-center gap-3 h-12 px-4 rounded-2xl bg-neutral-100 border-2 border-transparent focus-within:border-black focus-within:bg-white transition-colors">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un service"
            className="flex-1 min-w-0 bg-transparent text-[16px] font-medium placeholder:text-neutral-400 focus:outline-none"
            autoComplete="off"
          />
          {query && (
            <button type="button" aria-label="Effacer" onClick={() => setQuery('')} className="w-8 h-8 -mr-2 rounded-full flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          )}
        </label>

        {!query && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
            {[{ id: 'all' as const, label: 'Tout' }, ...CATEGORIES].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                className={`h-9 px-4 rounded-full text-sm font-bold shrink-0 transition-colors ${
                  filter === c.id ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {groups.length === 0 ? (
          <EmptyState icon={<Search className="w-6 h-6" />} title="Aucun service trouvé" text="Essayez un autre nom d'opérateur ou de service." />
        ) : (
          groups.map(({ c, items }) => {
            const Icon = ICONS[c.icon];
            return (
              <section key={c.id} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-[15px] font-bold">
                    <Icon className="w-4 h-4" /> {c.label}
                  </h3>
                  {c.id === 'subscriptions' && <TextLink onClick={() => setActiveModal('subscriptions')}>Mes abonnements</TextLink>}
                </div>
                <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                  {items.map((p) => (
                    <ProviderTile key={p.id} p={p} onPick={pick} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </Sheet>
  );
};
