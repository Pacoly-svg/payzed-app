import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, BarChart3, Car, FileText, Repeat, Send, ShoppingBag, Smartphone, Wallet } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { EmptyState, IconBox, List, PageTitle, Row, SectionTitle, Segmented } from '../ui';
import type { Transaction } from '../../types/banking';

type Period = '7d' | '30d' | '12m';

const DAY = 86_400_000;
const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** Regroupe les catégories techniques en postes lisibles. */
const GROUPS: { id: string; label: string; icon: React.ElementType; match: (t: Transaction) => boolean }[] = [
  { id: 'bills', label: 'Factures', icon: FileText, match: (t) => t.category === 'Logement & Factures' || t.type === 'bill' },
  { id: 'shopping', label: 'Courses & achats', icon: ShoppingBag, match: (t) => ['Supermarché', 'Alimentation', 'Alimentation & Restaurants', 'Loisirs & Shopping'].includes(t.category) },
  { id: 'phone', label: 'Crédit & internet', icon: Smartphone, match: (t) => t.type === 'topup' || t.category === 'Télécom & Données' || t.category === 'Télécom' },
  { id: 'subs', label: 'Abonnements', icon: Repeat, match: (t) => t.type === 'subscription' },
  { id: 'transport', label: 'Transport', icon: Car, match: (t) => t.category === 'Transport & Mobilité' },
  { id: 'send', label: 'Envois', icon: Send, match: (t) => t.type === 'transfer_out' },
];
const OTHER = { id: 'other', label: 'Autres', icon: Wallet };

const isSavingsMove = (t: Transaction) => t.title.startsWith('Coffre ');
/** Coût réel d'une dépense : montant + frais. */
const cost = (t: Transaction) => Math.abs(t.amount) + (t.fee || 0);

interface Bucket {
  label: string;
  title: string;
  start: number;
  end: number;
  total: number;
}

function buildBuckets(period: Period): Bucket[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (period === '12m') {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      return { label: MONTHS[d.getMonth()], title: `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`, start: d.getTime(), end: next.getTime(), total: 0 };
    });
  }
  const days = period === '7d' ? 7 : 30;
  return Array.from({ length: days }, (_, i) => {
    const start = today - (days - 1 - i) * DAY;
    const d = new Date(start);
    const showLabel = period === '7d' || i % 5 === 4 || i === days - 1;
    return {
      label: period === '7d' ? WEEKDAYS[d.getDay()] : showLabel ? String(d.getDate()) : '',
      title: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
      start,
      end: start + DAY,
      total: 0,
    };
  });
}

export const StatsScreen: React.FC = () => {
  const { transactions, setSelectedTransaction } = useBanking();
  const [period, setPeriod] = useState<Period>('30d');
  const [selected, setSelected] = useState<number | null>(null);

  const data = useMemo(() => {
    const buckets = buildBuckets(period);
    const from = buckets[0].start;
    const inRange = transactions.filter((t) => t.timestamp >= from && !isSavingsMove(t));
    const expenses = inRange.filter((t) => t.amount < 0);
    const income = inRange.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const spent = expenses.reduce((s, t) => s + cost(t), 0);

    for (const t of expenses) {
      const b = buckets.find((x) => t.timestamp >= x.start && t.timestamp < x.end);
      if (b) b.total += cost(t);
    }

    const groups = new Map<string, { label: string; icon: React.ElementType; total: number }>();
    for (const t of expenses) {
      const g = GROUPS.find((x) => x.match(t)) ?? OTHER;
      const cur = groups.get(g.id) ?? { label: g.label, icon: g.icon, total: 0 };
      cur.total += cost(t);
      groups.set(g.id, cur);
    }
    const categories = [...groups.values()].sort((a, b) => b.total - a.total);
    const top = [...expenses].sort((a, b) => a.amount - b.amount).slice(0, 3);
    return { buckets, income, spent, categories, top };
  }, [transactions, period]);

  const max = Math.max(1, ...data.buckets.map((b) => b.total));
  const sel = selected !== null ? data.buckets[selected] : null;
  const periodLabel = period === '7d' ? 'ces 7 derniers jours' : period === '30d' ? 'ces 30 derniers jours' : 'ces 12 derniers mois';

  return (
    <div className="space-y-7">
      <PageTitle>Stats</PageTitle>

      <Segmented
        value={period}
        onChange={(p) => {
          setPeriod(p);
          setSelected(null);
        }}
        options={[
          { id: '7d', label: '7 jours' },
          { id: '30d', label: '30 jours' },
          { id: '12m', label: '12 mois' },
        ]}
      />

      {/* Chiffres clés */}
      <List>
        <Row
          icon={<IconBox><ArrowDownLeft className="w-5 h-5" /></IconBox>}
          title="Reçu"
          trailing={<span className="text-[17px] font-bold text-emerald-600 whitespace-nowrap">+{formatCurrency(data.income, 'XOF')}</span>}
        />
        <Row
          icon={<IconBox><ArrowUpRight className="w-5 h-5" /></IconBox>}
          title="Dépensé"
          trailing={<span className="text-[17px] font-bold whitespace-nowrap">-{formatCurrency(data.spent, 'XOF')}</span>}
        />
      </List>

      {/* Graphique des dépenses — une seule série, une seule couleur */}
      <section className="space-y-3">
        <div>
          <p className="text-[13px] font-semibold text-neutral-500 first-letter:uppercase">{sel ? sel.title : `Dépenses ${periodLabel}`}</p>
          <p className="text-[26px] font-extrabold tracking-tight">{formatCurrency(sel ? sel.total : data.spent, 'XOF')}</p>
        </div>
        <div
          className="flex items-end h-40 border-b border-neutral-200"
          style={{ gap: data.buckets.length > 12 ? 2 : 6 }}
          role="img"
          aria-label={`Dépenses par ${period === '12m' ? 'mois' : 'jour'}`}
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          {data.buckets.map((b, i) => {
            const h = b.total > 0 ? Math.max(4, (b.total / max) * 100) : 0;
            const active = selected === i;
            return (
              <button
                key={b.start}
                type="button"
                onClick={() => setSelected(active ? null : i)}
                aria-label={`${b.title} : ${formatCurrency(b.total, 'XOF')}`}
                className="flex-1 h-full flex items-end"
              >
                <span
                  className={`w-full rounded-t-[4px] transition-colors ${
                    active ? 'bg-black' : selected === null ? 'bg-black' : 'bg-neutral-300'
                  }`}
                  style={{ height: `${h}%` }}
                />
              </button>
            );
          })}
        </div>
        <div className="flex" style={{ gap: data.buckets.length > 12 ? 2 : 6 }}>
          {data.buckets.map((b, i) => (
            <span
              key={b.start}
              className={`flex-1 text-center text-[11px] whitespace-nowrap ${selected === i ? 'font-bold text-black' : 'text-neutral-500'}`}
            >
              {b.label}
            </span>
          ))}
        </div>
        <p className="text-[13px] text-neutral-500">Touchez une barre pour voir le détail.</p>
      </section>

      {/* Répartition */}
      <section className="space-y-3">
        <SectionTitle>Où va votre argent</SectionTitle>
        {data.categories.length === 0 ? (
          <EmptyState icon={<BarChart3 className="w-6 h-6" />} title="Aucune dépense" text={`Rien de dépensé ${periodLabel}.`} />
        ) : (
          <List>
            {data.categories.map((c) => {
              const share = data.spent > 0 ? Math.round((c.total / data.spent) * 100) : 0;
              const Icon = c.icon;
              return (
                <div key={c.label} className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <IconBox>
                      <Icon className="w-5 h-5" />
                    </IconBox>
                    <span className="flex-1 min-w-0 text-[15px] font-semibold truncate">{c.label}</span>
                    <span className="text-right">
                      <span className="block text-[15px] font-bold">{formatCurrency(c.total, 'XOF')}</span>
                      <span className="block text-[13px] text-neutral-500">{share} %</span>
                    </span>
                  </div>
                  <div className="mt-2.5 ml-14 h-1.5 rounded-full bg-white overflow-hidden">
                    <div className="h-full rounded-full bg-black" style={{ width: `${share}%` }} />
                  </div>
                </div>
              );
            })}
          </List>
        )}
      </section>

      {data.top.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>Plus grosses dépenses</SectionTitle>
          <List>
            {data.top.map((t) => (
              <Row
                key={t.id}
                onClick={() => setSelectedTransaction(t)}
                title={t.title}
                subtitle={new Date(t.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                trailing={<span className="text-[15px] font-bold whitespace-nowrap">{formatCurrency(t.amount, 'XOF', { showSign: true })}</span>}
              />
            ))}
          </List>
        </section>
      )}
    </div>
  );
};
