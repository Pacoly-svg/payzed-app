import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, CreditCard, Eye, EyeOff, Lock, LockOpen, RefreshCw, RotateCw, SlidersHorizontal } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { useBackHandler } from '../../utils/backStack';
import { formatCurrency, formatTransactionDate, maskCardNumber } from '../../utils/formatters';
import { BrandLogo } from '../common/BrandLogo';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, EmptyState, IconBox, List, PageTitle, ProgressBar, Row, SectionTitle, TextLink, Toggle, groupDigits, parseAmount } from '../ui';
import type { VirtualCardData } from '../../types/banking';
import { countsAsMoved } from '../../utils/status';

const CARD_TYPES = new Set(['card_payment', 'subscription', 'pos']);
const MIN_LIMIT = 100_000;
const MAX_LIMIT = 20_000_000;
const LIMIT_STEP = 50_000;
const REVEAL_SECONDS = 30;

/* ---------- Éléments de la carte ---------- */

/** Puce EMV dorée avec ses contacts. */
const Chip = () => (
  <span className="chip relative block w-[13%] aspect-[1.3] rounded-[6px] overflow-hidden" aria-hidden>
    <span className="absolute inset-x-0 top-1/3 h-px bg-black/25" />
    <span className="absolute inset-x-0 top-2/3 h-px bg-black/25" />
    <span className="absolute inset-y-0 left-1/3 w-px bg-black/25" />
    <span className="absolute inset-y-0 left-2/3 w-px bg-black/25" />
    <span className="absolute left-1/3 right-1/3 top-1/3 bottom-1/3 rounded-sm border border-black/25" />
  </span>
);

/** Symbole sans contact (ondes). */
const Contactless = () => (
  <svg viewBox="0 0 24 24" className="w-[7%] h-auto text-white/85" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M8.5 7.5a6.5 6.5 0 0 1 0 9" />
    <path d="M12 5a10 10 0 0 1 0 14" />
    <path d="M15.5 2.5a13.5 13.5 0 0 1 0 19" />
  </svg>
);

const CardVisual: React.FC<{
  card: VirtualCardData;
  flipped: boolean;
  revealed: boolean;
  copied: boolean;
  onFlip: () => void;
  onCopy: () => void;
}> = ({ card, flipped, revealed, copied, onFlip, onCopy }) => {
  const last4 = card.fullNumber.replace(/\s/g, '').slice(-4);
  const face = 'card-face card-surface rounded-[18px] overflow-hidden text-white select-none';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={flipped ? 'Voir le recto de la carte' : 'Voir le verso de la carte'}
      onClick={onFlip}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onFlip()}
      className={`card-flip w-full aspect-[1.586] cursor-pointer [container-type:inline-size] ${flipped ? 'is-flipped' : ''}`}
    >
      <div className={`card-flip-inner transition-[filter] ${card.isFrozen ? 'grayscale brightness-[0.55]' : ''}`}>
        {/* ---------- RECTO ---------- */}
        <div className={`${face} flex flex-col p-[6.5%]`}>
          <div className="card-glare" />
          <div className="flex items-start justify-between">
            <img src="/assets/logo/logo-principal-blanc.svg" alt="Payzed" className="h-[1.6rem] w-auto" style={{ height: '7.5cqw' }} />
            <span className="font-bold tracking-[0.18em] text-white/70" style={{ fontSize: '2.9cqw' }}>
              DEBIT
            </span>
          </div>
          <div className="flex items-center gap-[4%] mt-[7%]">
            <Chip />
            <Contactless />
          </div>
          <p className="emboss mt-auto font-semibold tabular-nums whitespace-nowrap" style={{ fontSize: '6cqw', letterSpacing: '0.1em' }}>
            {revealed ? maskCardNumber(card.fullNumber, true) : `•••• •••• •••• ${last4}`}
          </p>
          <div className="flex items-end justify-between gap-3 mt-[3%]">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="leading-[1.05] text-white/60 font-semibold" style={{ fontSize: '2.2cqw' }}>
                  VALID
                  <br />
                  THRU
                </span>
                <span className="emboss font-semibold tabular-nums" style={{ fontSize: '4.4cqw' }}>
                  {revealed ? `${card.expiryMonth}/${card.expiryYear}` : '••/••'}
                </span>
              </div>
              <p className="emboss font-semibold uppercase truncate mt-[2%]" style={{ fontSize: '4.2cqw', letterSpacing: '0.06em' }}>
                {card.cardholderName}
              </p>
            </div>
            <img src="/logos/visa-white.svg" alt="Visa" className="shrink-0 -my-[3%]" style={{ width: '19cqw', height: '19cqw' }} />
          </div>
        </div>

        {/* ---------- VERSO ---------- */}
        <div className={`${face} card-face-back flex flex-col`}>
          <div className="card-glare" />
          {/* Bande magnétique */}
          <div
            className="mt-[6%] h-[18%]"
            style={{ background: 'linear-gradient(180deg, #3a3a3d 0%, #0b0b0c 18%, #000 50%, #0b0b0c 82%, #3a3a3d 100%)' }}
          />
          {/* Panneau de signature + CVV */}
          <div className="flex items-center gap-[3%] px-[6.5%] mt-[5%]">
            <div
              className="flex-1 h-[11cqw] rounded-[2px] flex items-center justify-end pr-[3%]"
              style={{ background: 'repeating-linear-gradient(135deg, #f4f4f5 0 6px, #e4e4e7 6px 12px)' }}
            >
              <span className="text-neutral-700 italic tabular-nums" style={{ fontSize: '3.4cqw' }}>
                {last4}
              </span>
            </div>
            <div className="bg-white text-black rounded-[3px] px-[2.5%] h-[11cqw] flex flex-col justify-center items-center min-w-[16%]">
              <span className="text-neutral-500 font-semibold leading-none" style={{ fontSize: '2.1cqw' }}>
                CVV
              </span>
              <span className="font-bold tabular-nums leading-tight" style={{ fontSize: '4.2cqw' }}>
                {revealed ? card.cvv : '•••'}
              </span>
            </div>
          </div>
          {/* Hologramme + mentions */}
          <div className="flex items-end gap-[4%] px-[6.5%] mt-auto mb-[6%]">
            <div className="flex-1 min-w-0 text-white/60 leading-snug" style={{ fontSize: '2.2cqw' }}>
              <p>Carte non transférable. Usage soumis aux conditions générales Payzed.</p>
              <p className="mt-[2%]">Perte ou vol : bloquez immédiatement la carte depuis l'application Payzed.</p>
              <p className="mt-[2%] flex items-center gap-2 text-white/80 font-semibold tabular-nums">
                {revealed ? maskCardNumber(card.fullNumber, true) : `•••• ${last4}`}
                {revealed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopy();
                    }}
                    aria-label="Copier le numéro de carte"
                    className="rounded-full bg-white/15 inline-flex items-center gap-1 font-semibold text-white active:scale-95 transition-transform"
                    style={{ height: '6.4cqw', padding: '0 2.2cqw', fontSize: '2.6cqw' }}
                  >
                    {copied ? <Check style={{ width: '2.8cqw', height: '2.8cqw' }} /> : <Copy style={{ width: '2.8cqw', height: '2.8cqw' }} />}
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                )}
              </p>
            </div>
            <div className="hologram shrink-0 rounded-[4px]" style={{ width: '17cqw', height: '12cqw' }} aria-label="Hologramme" />
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

/** Date de remise à zéro du plafond (1er du mois suivant). */
const nextReset = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
};

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
  const [flipped, setFlipped] = useState(false);
  const [revealUntil, setRevealUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [sheet, setSheet] = useState<'limit' | 'replace' | null>(null);

  const revealed = revealUntil !== null && !card.isFrozen;
  // Retour Android : masquer les infos, puis remettre la carte côté recto
  useBackHandler(() => {
    if (revealed) setRevealUntil(null);
    else setFlipped(false);
  }, revealed || flipped);

  // Les informations se masquent toutes seules après 30 s
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
    const all = transactions.filter((t) => t.amount < 0 && CARD_TYPES.has(t.type) && countsAsMoved(t));
    return {
      spent: all.filter((t) => t.timestamp >= start.getTime()).reduce((s, t) => s + Math.abs(t.amount), 0),
      cardTx: all.slice(0, 4),
    };
  }, [transactions]);
  const remaining = Math.max(0, card.spendingLimit - spent);
  const usage = card.spendingLimit > 0 ? (spent / card.spendingLimit) * 100 : 0;

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
          <CardVisual card={card} flipped={flipped} revealed={revealed} copied={copied} onFlip={() => setFlipped((f) => !f)} onCopy={copy} />
          {card.isFrozen && (
            <div className="absolute inset-0 rounded-[18px] flex flex-col items-center justify-center gap-2 text-white pointer-events-none">
              <span className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </span>
              <span className="text-[15px] font-bold">Carte bloquée</span>
            </div>
          )}
        </div>
        <p className="flex items-center justify-center gap-1.5 text-center text-[13px] text-neutral-500 min-h-5 leading-5">
          {revealed ? (
            `Informations visibles encore ${secondsLeft} s`
          ) : card.isFrozen ? (
            'Aucun paiement possible tant que la carte est bloquée'
          ) : (
            <>
              <RotateCw className="w-3.5 h-3.5" /> Touchez la carte pour voir le {flipped ? 'recto' : 'verso'}
            </>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-4">
        <Action icon={revealed ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />} label={revealed ? 'Masquer' : 'Afficher'} onClick={toggleReveal} />
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
        <SectionTitle action={<TextLink onClick={() => setSheet('limit')}>Modifier</TextLink>}>Plafond de paiement</SectionTitle>
        <div className="rounded-3xl bg-neutral-100 p-5">
          <p className="text-[13px] font-semibold text-neutral-500">Encore disponible ce mois-ci</p>
          <p className="text-[28px] font-extrabold tracking-tight leading-tight">{formatCurrency(remaining, 'XOF')}</p>
          <ProgressBar value={usage} className="mt-4 bg-white h-2.5" />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <p className="text-[12px] text-neutral-500">Dépensé</p>
              <p className="text-[15px] font-bold">{formatCurrency(spent, 'XOF')}</p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-neutral-500">Plafond mensuel</p>
              <p className="text-[15px] font-bold">{formatCurrency(card.spendingLimit, 'XOF')}</p>
            </div>
          </div>
          <p className="text-[12px] text-neutral-500 mt-3">Remise à zéro le {nextReset()}</p>
        </div>
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
                    <BrandLogo brand={t.brandLogo} size={44} />
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

      {sheet === 'limit' && <LimitSheet spent={spent} onClose={() => setSheet(null)} />}
      {sheet === 'replace' && (
        <ReplaceSheet
          onClose={() => setSheet(null)}
          onDone={() => {
            setRevealUntil(null);
            setFlipped(false);
            setSheet(null);
          }}
        />
      )}
    </div>
  );
};

/* ---------- Plafond ---------- */

const LimitSheet: React.FC<{ spent: number; onClose: () => void }> = ({ spent, onClose }) => {
  const { card, updateSpendingLimit, showToast } = useBanking();
  const [amount, setAmount] = useState(String(card.spendingLimit));
  const value = parseAmount(amount);
  const valid = value >= MIN_LIMIT && value <= MAX_LIMIT;
  const sliderValue = Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, value || MIN_LIMIT));
  const left = Math.max(0, value - spent);

  return (
    <Sheet title="Plafond mensuel" onClose={onClose} confirmClose={value !== card.spendingLimit}>
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
        <AmountField
          label="Nouveau plafond"
          value={amount}
          onChange={setAmount}
          hint={
            valid ? (
              `Il vous restera ${formatCurrency(left, 'XOF')} à dépenser ce mois-ci.`
            ) : (
              <span className="text-red-600">
                Entre {formatCurrency(MIN_LIMIT, 'XOF')} et {formatCurrency(MAX_LIMIT, 'XOF')}
              </span>
            )
          }
        />
        <div>
          <input
            type="range"
            className="limit-range w-full"
            min={MIN_LIMIT}
            max={MAX_LIMIT}
            step={LIMIT_STEP}
            value={sliderValue}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Ajuster le plafond"
          />
          <div className="flex justify-between text-[12px] text-neutral-500 px-0.5">
            <span>{groupDigits(String(MIN_LIMIT))}</span>
            <span>{groupDigits(String(MAX_LIMIT))} FCFA</span>
          </div>
        </div>
        <p className="rounded-2xl bg-neutral-100 px-4 py-3 text-[13px] text-neutral-600">
          Le plafond limite le total des paiements par carte sur un mois. Il est remis à zéro le 1er de chaque mois.
        </p>
        <Button type="submit" className="w-full" disabled={!valid || value === card.spendingLimit}>
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
