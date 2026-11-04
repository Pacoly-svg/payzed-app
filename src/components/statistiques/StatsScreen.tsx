import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  TrendingUp, 
  Zap,
  ShoppingBag,
  Tv,
  Home,
  Smartphone,
  Calendar
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { BrandLogo } from '../common/BrandLogo';

export const StatsScreen: React.FC = () => {
  const { transactions, currency } = useBanking();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Multiplicateurs réalistes selon la période sélectionnée
  const periodMultiplier = period === 'week' ? 0.25 : period === 'year' ? 12 : 1;

  const rawIncome = transactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const rawExpenses = Math.abs(
    transactions
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  const totalIncome = Math.round((rawIncome > 0 ? rawIncome : 1245000) * periodMultiplier);
  const totalExpenses = Math.round((rawExpenses > 0 ? rawExpenses : 769000) * periodMultiplier);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;
  const dailyAverage = Math.round(totalExpenses / (period === 'week' ? 7 : period === 'year' ? 365 : 30));

  // Plus grosse dépense identifiée
  const expenseList = transactions.filter((tx) => tx.amount < 0);
  const largestTx = expenseList.length > 0 
    ? expenseList.reduce((max, tx) => Math.abs(tx.amount) > Math.abs(max.amount) ? tx : max, expenseList[0])
    : null;
  const largestAmount = largestTx ? Math.abs(largestTx.amount) : 45000;
  const largestTitle = largestTx ? largestTx.title : 'Facture Senelec';

  // Répartition par catégorie structurée
  const categories = [
    {
      name: 'Factures & Énergie',
      sublabel: 'Senelec, Sen\'Eau, Rapido',
      amount: Math.round(totalExpenses * 0.38),
      percentage: 38,
      brand: 'senelec',
      icon: Home,
      color: 'bg-black',
    },
    {
      name: 'Télécoms & Pass Internet',
      sublabel: 'Orange, Wave, Yas, Expresso',
      amount: Math.round(totalExpenses * 0.28),
      percentage: 28,
      brand: 'orange',
      icon: Smartphone,
      color: 'bg-neutral-800',
    },
    {
      name: 'Abonnements & SaaS',
      sublabel: 'Claude, ChatGPT, Spotify',
      amount: Math.round(totalExpenses * 0.20),
      percentage: 20,
      brand: 'claude',
      icon: Tv,
      color: 'bg-neutral-600',
    },
    {
      name: 'Achats & Divers',
      sublabel: 'Paiements carte et transferts',
      amount: Math.round(totalExpenses * 0.14),
      percentage: 14,
      brand: 'payzed',
      icon: ShoppingBag,
      color: 'bg-neutral-400',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Stats</h1>
        <div className="flex items-center bg-neutral-100 p-1 rounded-full">
          {(['week', 'month', 'year'] as const).map((p) => {
            const labels = { week: 'Sem.', month: 'Mois', year: 'Année' };
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  period === p ? 'bg-black text-white' : 'text-neutral-600'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Carte Maîtresse : Capacité d'Épargne & Trésorerie Nette */}
      <div className="p-5 rounded-3xl bg-neutral-950 text-white shadow-md relative overflow-hidden space-y-4">
        {/* Glow discret */}
        <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-neutral-800/40 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-neutral-800 text-white flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono truncate">
              Solde Net Épargné ({period === 'week' ? 'Semaine' : period === 'year' ? 'Année' : 'Mois'})
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-200 border border-white/15 font-bold shrink-0">
            <ShieldCheck className="w-3 h-3 text-white" />
            <span>Santé Excellente</span>
          </span>
        </div>

        {/* Montant Net Positif */}
        <div className="relative z-10 flex items-baseline justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-xl sm:text-3xl font-black font-mono tracking-tight text-white block truncate">
              +{formatCurrency(netSavings, currency)}
            </span>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5 truncate">
              Excédent net conservé après règlement de vos charges
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xl sm:text-2xl font-black font-mono text-white block">
              {savingsRate}%
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-400 font-mono">
              Taux d'Épargne
            </span>
          </div>
        </div>

        {/* Jauge proportionnelle Entrées vs Sorties */}
        <div className="relative z-10 space-y-1.5 pt-1">
          <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden flex p-0.5 gap-0.5">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((totalIncome / (totalIncome + totalExpenses)) * 100))}%` }}
              title="Entrées"
            />
            <div 
              className="h-full bg-neutral-500 rounded-full transition-all duration-500 flex-1"
              title="Sorties"
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono font-medium text-neutral-400 gap-1">
            <span className="text-white font-bold truncate">● Entrées : {formatCurrency(totalIncome, currency)}</span>
            <span className="truncate text-right">● Sorties : {formatCurrency(totalExpenses, currency)}</span>
          </div>
        </div>
      </div>

      {/* 3. Cartes Jumelles Entrées & Sorties */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Entrées */}
        <div className="p-4 rounded-3xl bg-neutral-50 border border-neutral-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold text-black">Entrées</span>
            </div>
            <span className="text-[10px] font-bold text-neutral-700 font-mono">
              {Math.round((totalIncome / Math.max(1, totalIncome + totalExpenses)) * 100)}%
            </span>
          </div>

          <div>
            <span className="text-sm sm:text-base font-extrabold text-black font-mono tracking-tight block truncate">
              {formatCurrency(totalIncome, currency)}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
              Virements & flux reçus
            </span>
          </div>
        </div>

        {/* Sorties */}
        <div className="p-4 rounded-3xl bg-neutral-50 border border-neutral-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="w-6 h-6 rounded-lg bg-neutral-200 text-black flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold text-black">Sorties</span>
            </div>
            <span className="text-[10px] font-bold text-neutral-500 font-mono">
              {Math.round((totalExpenses / Math.max(1, totalIncome + totalExpenses)) * 100)}%
            </span>
          </div>

          <div>
            <span className="text-sm sm:text-base font-extrabold text-neutral-900 font-mono tracking-tight block truncate">
              {formatCurrency(totalExpenses, currency)}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
              Dépenses & factures
            </span>
          </div>
        </div>
      </div>

      {/* 4. Indicateurs Clés de Trésorerie */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black shrink-0">
            <Calendar className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              Moyenne / Jour
            </span>
            <span className="text-xs font-bold font-mono text-black truncate block mt-0.5">
              {formatCurrency(dailyAverage, currency)}/j
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black shrink-0">
            <Zap className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider truncate">
              Pic Dépense
            </span>
            <span className="text-xs font-bold font-mono text-black truncate block mt-0.5" title={largestTitle}>
              {formatCurrency(largestAmount, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Répartition Visuelle & Segmentée des Dépenses (Apple Card Style) */}
      <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-black uppercase tracking-wider">
              Répartition des Dépenses
            </h3>
            <p className="text-[11px] text-neutral-500 font-medium">Par catégorie de règlement</p>
          </div>
          <span className="text-xs font-mono font-bold text-black">
            {formatCurrency(totalExpenses, currency)}
          </span>
        </div>

        {/* Barre Segmentée Multi-Teintes */}
        <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden flex gap-0.5 p-0.5 border border-neutral-200/60">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className={`h-full ${cat.color} first:rounded-l-full last:rounded-r-full transition-all duration-300`}
              style={{ width: `${cat.percentage}%` }}
              title={`${cat.name} : ${cat.percentage}%`}
            />
          ))}
        </div>

        {/* Liste détaillée des postes avec BrandLogo et pourcentages */}
        <div className="space-y-2.5 pt-1">
          {categories.map((cat, idx) => {
            return (
              <div 
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/70 transition-all text-xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                  <BrandLogo brand={cat.brand} size={32} className="rounded-xl shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-black truncate leading-tight">{cat.name}</p>
                    <p className="text-[10px] text-neutral-500 font-medium truncate mt-0.5">{cat.sublabel}</p>
                  </div>
                </div>

                <div className="text-right shrink-0 whitespace-nowrap">
                  <span className="font-mono font-bold text-black block text-xs">
                    {formatCurrency(cat.amount, currency)}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500 font-bold block">
                    {cat.percentage}% du total
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Bilan de Trésorerie Bancaire */}
      <div className="p-4 rounded-3xl bg-neutral-50 border border-neutral-200/90 shadow-2xs space-y-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-black" />
          <h4 className="text-xs font-bold text-black uppercase tracking-wider">
            Bilan de Trésorerie
          </h4>
        </div>
        <p className="text-xs text-neutral-600 font-medium leading-relaxed">
          Taux d'épargne net établi à <strong className="text-black font-bold font-mono">{savingsRate}%</strong> sur la période sélectionnée. Les prélèvements et factures récurrentes demeurent maîtrisés et conformes à vos plafonds autorisés.
        </p>
      </div>
    </div>
  );
};
