import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, CreditCard, Eye, EyeOff, Lock, LockOpen, RefreshCw, SlidersHorizontal, Wifi } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency, formatTransactionDate, maskCardNumber } from '../../utils/formatters';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, Card, EmptyState, IconBox, List, PageTitle, ProgressBar, Row, SectionTitle, TextLink, Toggle, parseAmount } from '../ui';
import type { VirtualCardData } from '../../types/banking';

const CARD_TYPES = new Set(['card_payment', 'subscription', 'pos']);
const MIN_LIMIT = 100_000;
const MAX_LIMIT = 20_000_000;
const REVEAL_SECONDS = 30;

/* ---------- Visuel de la carte (recto / verso) ---------- */

const Chip = () => (
  <span className="block w-11 h-8 rounded-md bg-gradient-to-br from-neutral-200 to-neutral-400 relative overflow-hidden">
    <span className="absolute inset-x-0 top-1/2 h-px bg-neutral-500/50" />
    <span className="absolute inset-y-0 left-1/3 w-px bg-neutral-500/50" />
    <span className="absolute inset-y-0 right-1/3 w-px bg-neutral-500/50" />
  </span>
);

const CardVisual: React.FC<{ card: VirtualCardData; flipped: boolean; onCopy: () => void; copied: boolean; onTap: () => void }> = ({
  card,
  flipped,
  onCopy,
  copied,
  onTap,
}) => {
  const face = 'card-face rounded-[22px] p-5 text-white overflow-hidden';
  const bg = { background: 'radial-gradient(120% 140% at 0% 0%, #3a3a3a 0%, #121212 45%, #000 100%)' };

  return (
    <div className={`card-flip w-full aspect-[1.586] ${flipped ? 'is-flipped' : ''}`}>
      <div className={`card-flip-inner transition-[filter] ${card.isFrozen ? 'grayscale brightness-[0.6]' : ''}`}>
        {/* Recto */}
        <button type="button" onClick={onTap} aria-label="Afficher les informations de la carte" className={`${face} text-left flex flex-col justify-between`} style={bg}>
          <span className="flex items-start justify-between">
            <img src="/assets/logo/logo-principal-blanc.svg" alt="Payzed" className="h-6 w-auto" />
            <Wifi className="w-6 h-6 rotate-90 text-white/80" />
          </span>
          <Chip />
          <span className="flex items-end justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-[18px] font-semibold tracking-[0.15em] tabular-nums">•••• {card.fullNumber.replace(/\s/g, '').slice(-4)}</span>
              <span className="block text-[13px] font-semibold uppercase mt-1 truncate text-white/80">{card.cardholderName}</span>
            </span>
            <img src="/logos/visa-white.svg" alt="Visa" className="h-12 w-12 -my-3 -mr-1 shrink-0" />
          </span>
        </button>

        {/* Verso */}
        <div className={`${face} card-face-back flex flex-col`} style={bg} onClick={onTap}>
          <span className="-mx-5 mt-1 h-10 bg-neutral-800 shrink-0" />
          <div className="flex-1 flex flex-col justify-center gap-3">
            <div>
              <p className="text-[11px] text-white/50">Numéro de carte</p>
              <p className="text-[clamp(1rem,5.4vw,1.35rem)] font-semibold tracking-[0.08em] tabular-nums whitespace-nowrap">{maskCardNumber(card.fullNumber, true)}</p>
            </div>
            <div className="flex items-end gap-8">
              <div>
                <p className="text-[11px] text-white/50">Expire fin</p>
                <p className="text-[17px] font-semibold tabular-nums">
                  {card.expiryMonth}/{card.expiryYear}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-white/50">CVV</p>
                <p className="text-[17px] font-semibold tabular-nums">{card.cvv}</p>
              </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy();
                  }}
                  aria-label="Copier le numéro"
                  className="ml-auto h-9 px-3 rounded-full bg-white/15 flex items-center gap-1.5 text-[13px] font-semibold shrink-0 active:scale-90 transition-transform"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Action: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }> = ({ icon, label, onClick, active }) => (
  <button type="button" onClick={onClick} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
    <span className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-black text-white' : 'bg-neutral-100'}`}>
      {icon}
    </span>
    <span className="text-[13px] font-semibold">{label}</span>
  </button>
);

/* ---------- Écran ---------- */

export const CardsScreen: React.FC = () => {
  const {
    card,
    transactions,
    toggleFreezeCard,
    toggleOnlinePayments,
    toggleContactless,
    toggleAtmWithdrawals,
    toggleInternational,
    setSelectedTransaction,
    showToast,
  } = useBanking();
  const [revealUntil, setRevealUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [sheet, setSheet] = useState<'limit' | 'replace' | null>(null);

  const revealed = revealUntil !== null && !card.isFrozen;

  // Les infos se masquent toutes seules après 30 s
  useEffect(() => {
    if (revealUntil === null) return;
    const tick = () => {
      const left = Math.ceil((revealUntil - Date.now()) / 1000);
      if (left <= 0) setRevealUntil(null);
      else setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [revealUntil]);

  const toggleReveal = () => {
    if (card.isFrozen) return showToast('Débloquez la carte pour voir ses informations');
    setRevealUntil(revealed ? null : Date.now() + REVEAL_SECONDS * 1000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(card.fullNumber.replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast('Copie impossible');
    }
  };

  const { spent, cardTx } = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const all = transactions.filter((t) => t.amount < 0 && CARD_TYPES.has(t.type));
    return {
      spent: all.filter((t) => t.timestamp >= start.getTime()).reduce((s, t) => s + Math.abs(t.amount), 0),
      cardTx: all.slice(0, 4),
    };
  }, [transactions]);
  const usage = card.spendingLimit > 0 ? Math.round((spent / card.spendingLimit) * 100) : 0;

  const settings = [
    { label: 'Paiements en ligne', hint: 'Sites et applications', on: card.onlinePaymentsEnabled, toggle: toggleOnlinePayments },
    { label: 'Sans contact', hint: 'Paiement en magasin', on: card.contactlessEnabled, toggle: toggleContactless },
    { label: 'Retraits au distributeur', hint: 'Guichets automatiques', on: card.atmWithdrawalsEnabled, toggle: toggleAtmWithdrawals },
    { label: "Paiements à l'étranger", hint: 'Hors Sénégal', on: card.internationalEnabled ?? true, toggle: toggleInternational },
  ];

  return (
    <div className="space-y-7">
      <PageTitle>Ma carte</PageTitle>

      <div className="space-y-3">
        <div className="relative">
          <CardVisual card={card} flipped={revealed} onCopy={copy} copied={copied} onTap={toggleReveal} />
          {card.isFrozen && (
            <div className="absolute inset-0 rounded-[22px] flex flex-col items-center justify-center gap-2 text-white pointer-events-none">
              <span className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </span>
              <span className="text-[15px] font-bold">Carte bloquée</span>
            </div>
          )}
        </div>
        <p className="text-center text-[13px] text-neutral-500 min-h-5 leading-5">
          {revealed
            ? `Informations masquées dans ${secondsLeft} s`
            : card.isFrozen
              ? 'Aucun paiement possible tant que la carte est bloquée'
              : 'Carte virtuelle Visa · touchez pour voir les infos'}
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-4">
        <Action icon={revealed ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />} label={revealed ? 'Masquer' : 'Infos'} onClick={toggleReveal} />
        <Action
          icon={card.isFrozen ? <LockOpen className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          label={card.isFrozen ? 'Débloquer' : 'Bloquer'}
          active={card.isFrozen}
          onClick={() => {
            toggleFreezeCard();
            setRevealUntil(null);
            showToast(card.isFrozen ? 'Carte débloquée' : 'Carte bloquée');
          }}
        />
        <Action icon={<SlidersHorizontal className="w-6 h-6" />} label="Plafond" onClick={() => setSheet('limit')} />
        <Action icon={<RefreshCw className="w-6 h-6" />} label="Remplacer" onClick={() => setSheet('replace')} />
      </div>

      {/* Plafond */}
      <section className="space-y-3">
        <SectionTitle action={<TextLink onClick={() => setSheet('limit')}>Modifier</TextLink>}>Dépenses du mois</SectionTitle>
        <Card className="p-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[26px] font-extrabold tracking-tight">{formatCurrency(spent, 'XOF')}</p>
            <p className="text-[13px] font-bold">{spent > 0 && usage < 1 ? '< 1' : usage} %</p>
          </div>
          <ProgressBar value={usage} className="mt-3 bg-white" />
          <p className="text-[13px] text-neutral-500 mt-2.5">
            Plafond {formatCurrency(card.spendingLimit, 'XOF')} · reste{' '}
            <span className="font-bold text-black">{formatCurrency(Math.max(0, card.spendingLimit - spent), 'XOF')}</span>
          </p>
        </Card>
      </section>

      {/* Opérations carte */}
      <section className="space-y-3">
        <SectionTitle>Paiements par carte</SectionTitle>
        {cardTx.length === 0 ? (
          <EmptyState icon={<CreditCard className="w-6 h-6" />} title="Aucun paiement par carte" />
        ) : (
          <List>
            {cardTx.map((t) => (
              <Row
                key={t.id}
                onClick={() => setSelectedTransaction(t)}
                icon={
                  t.brandLogo ? (
                    <BrandLogo brand={t.brandLogo} size={44} className="rounded-2xl" />
                  ) : (
                    <IconBox>
                      <CreditCard className="w-5 h-5" />
                    </IconBox>
                  )
                }
                title={t.title}
                subtitle={formatTransactionDate(t.timestamp)}
                trailing={<span className="text-[15px] font-bold whitespace-nowrap">{formatCurrency(t.amount, 'XOF', { showSign: true })}</span>}
              />
            ))}
          </List>
        )}
      </section>

      {/* Réglages */}
      <section className="space-y-3">
        <SectionTitle>Réglages de la carte</SectionTitle>
        <List>
          {settings.map((o) => (
            <div key={o.label} className="flex items-center gap-3 px-4 py-4">
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold">{o.label}</span>
                <span className="block text-[13px] text-neutral-500 mt-0.5">{o.hint}</span>
              </span>
              <Toggle on={o.on} onChange={o.toggle} label={o.label} />
            </div>
          ))}
        </List>
      </section>

      {sheet === 'limit' && <LimitSheet onClose={() => setSheet(null)} />}
      {sheet === 'replace' && (
        <ReplaceSheet
          onClose={() => setSheet(null)}
          onDone={() => {
            setRevealUntil(null);
            setSheet(null);
          }}
        />
      )}
    </div>
  );
};

/* ---------- Plafond ---------- */

const LimitSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { card, updateSpendingLimit, showToast } = useBanking();
  const [amount, setAmount] = useState(String(card.spendingLimit));
  const value = parseAmount(amount);
  const valid = value >= MIN_LIMIT && value <= MAX_LIMIT;
  const range = `Entre ${formatCurrency(MIN_LIMIT, 'XOF')} et ${formatCurrency(MAX_LIMIT, 'XOF')}`;

  return (
    <Sheet title="Plafond mensuel" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          updateSpendingLimit(value);
          showToast('Plafond mis à jour');
          onClose();
        }}
        className="space-y-5"
      >
        <AmountField label="Nouveau plafond" value={amount} onChange={setAmount} hint={valid || !value ? range : <span className="text-red-600">{range}</span>} />
        <Button type="submit" className="w-full" disabled={!valid}>
          Enregistrer
        </Button>
      </form>
    </Sheet>
  );
};

/* ---------- Remplacement (perte / vol) ---------- */

const ReplaceSheet: React.FC<{ onClose: () => void; onDone: () => void }> = ({ onClose, onDone }) => {
  const { replaceCard, showToast } = useBanking();
  return (
    <Sheet title="Remplacer la carte" onClose={onClose}>
      <p className="text-[15px] text-neutral-600">
        Carte perdue, volée ou numéro compromis ? La carte actuelle est détruite immédiatement et une nouvelle carte virtuelle, avec un
        nouveau numéro et un nouveau CVV, est créée. Vos réglages et votre plafond sont conservés.
      </p>
      <div className="space-y-2 mt-6">
        <Button
          className="w-full"
          onClick={() => {
            replaceCard();
            showToast('Nouvelle carte créée');
            onDone();
          }}
        >
          Remplacer ma carte
        </Button>
        <Button variant="secondary" className="w-full" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </Sheet>
  );
};
