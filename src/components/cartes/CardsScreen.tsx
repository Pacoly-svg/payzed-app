import React, { useMemo, useState } from 'react';
import { Check, Copy, Eye, EyeOff, Lock, LockOpen } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency, maskCardNumber } from '../../utils/formatters';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, Card, List, PageTitle, ProgressBar, SectionTitle, TextLink, Toggle, parseAmount } from '../ui';

const CARD_TYPES = new Set(['card_payment', 'subscription', 'pos']);
const MIN_LIMIT = 100_000;
const MAX_LIMIT = 20_000_000;

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }> = ({
  icon,
  label,
  onClick,
  active,
}) => (
  <button type="button" onClick={onClick} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
    <span className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-black text-white' : 'bg-neutral-100'}`}>
      {icon}
    </span>
    <span className="text-[13px] font-semibold">{label}</span>
  </button>
);

export const CardsScreen: React.FC = () => {
  const { card, transactions, toggleFreezeCard, toggleOnlinePayments, toggleContactless, toggleAtmWithdrawals, showToast } = useBanking();
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editLimit, setEditLimit] = useState(false);

  // Dépenses carte réelles du mois en cours
  const spent = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return transactions
      .filter((t) => t.amount < 0 && CARD_TYPES.has(t.type) && t.timestamp >= start.getTime())
      .reduce((s, t) => s + Math.abs(t.amount), 0);
  }, [transactions]);
  const usage = card.spendingLimit > 0 ? Math.round((spent / card.spendingLimit) * 100) : 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(card.fullNumber.replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast('Copie impossible');
    }
  };

  return (
    <div className="space-y-7">
      <PageTitle>Ma carte</PageTitle>

      {/* Visuel de la carte */}
      <div
        className={`relative w-full aspect-[1.586] rounded-[24px] p-5 text-white overflow-hidden transition-[filter] duration-300 ${
          card.isFrozen ? 'grayscale brightness-75' : ''
        }`}
        style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 55%, #000 100%)' }}
      >
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <img src="/assets/logo/logo-principal-blanc.svg" alt="Payzed" className="h-6 w-auto" />
            {card.isFrozen && (
              <span className="flex items-center gap-1.5 text-[13px] font-semibold bg-white/15 rounded-full px-3 py-1">
                <Lock className="w-3.5 h-3.5" /> Bloquée
              </span>
            )}
          </div>
          <p className="text-[clamp(1.05rem,5.5vw,1.4rem)] font-semibold tracking-[0.12em] tabular-nums">
            {maskCardNumber(card.fullNumber, showDetails)}
          </p>
          <div className="flex items-end justify-between gap-3">
            <div className="flex gap-5 min-w-0">
              <div className="min-w-0">
                <p className="text-[11px] text-white/50">Titulaire</p>
                <p className="text-[13px] font-semibold uppercase truncate">{card.cardholderName}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/50">Expire</p>
                <p className="text-[13px] font-semibold tabular-nums">
                  {card.expiryMonth}/{card.expiryYear}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-white/50">CVV</p>
                <p className="text-[13px] font-semibold tabular-nums">{showDetails ? card.cvv : '•••'}</p>
              </div>
            </div>
            <span className="text-xl font-extrabold italic tracking-tighter shrink-0">VISA</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3">
        <ActionButton
          icon={showDetails ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
          label={showDetails ? 'Masquer' : 'Afficher'}
          onClick={() => setShowDetails((v) => !v)}
        />
        <ActionButton icon={copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />} label={copied ? 'Copié' : 'Copier'} onClick={copy} />
        <ActionButton
          icon={card.isFrozen ? <LockOpen className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          label={card.isFrozen ? 'Débloquer' : 'Bloquer'}
          active={card.isFrozen}
          onClick={() => {
            toggleFreezeCard();
            showToast(card.isFrozen ? 'Carte débloquée' : 'Carte bloquée');
          }}
        />
      </div>

      {/* Plafond */}
      <section className="space-y-3">
        <SectionTitle action={<TextLink onClick={() => setEditLimit(true)}>Modifier</TextLink>}>Dépenses du mois</SectionTitle>
        <Card className="p-5">
          <p className="text-[26px] font-extrabold tracking-tight">{formatCurrency(spent, 'XOF')}</p>
          <p className="text-[13px] text-neutral-500 mt-0.5">sur un plafond de {formatCurrency(card.spendingLimit, 'XOF')}</p>
          <ProgressBar value={usage} className="mt-4 bg-white" />
          <p className="text-[13px] text-neutral-500 mt-2">
            Il vous reste <span className="font-bold text-black">{formatCurrency(Math.max(0, card.spendingLimit - spent), 'XOF')}</span> ce mois-ci
          </p>
        </Card>
      </section>

      {/* Réglages */}
      <section className="space-y-3">
        <SectionTitle>Réglages</SectionTitle>
        <List>
          {[
            { label: 'Paiements en ligne', hint: 'Sites et applications', on: card.onlinePaymentsEnabled, toggle: toggleOnlinePayments },
            { label: 'Sans contact', hint: 'Paiement en magasin', on: card.contactlessEnabled, toggle: toggleContactless },
            { label: 'Retraits au distributeur', hint: 'Guichets automatiques', on: card.atmWithdrawalsEnabled, toggle: toggleAtmWithdrawals },
          ].map((o) => (
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

      {editLimit && <LimitSheet onClose={() => setEditLimit(false)} />}
    </div>
  );
};

const LimitSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { card, updateSpendingLimit, showToast } = useBanking();
  const [amount, setAmount] = useState(String(card.spendingLimit));
  const value = parseAmount(amount);
  const valid = value >= MIN_LIMIT && value <= MAX_LIMIT;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    updateSpendingLimit(value);
    showToast('Plafond mis à jour');
    onClose();
  };

  return (
    <Sheet title="Plafond mensuel" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <AmountField
          label="Nouveau plafond"
          value={amount}
          onChange={setAmount}
          hint={
            valid || !value
              ? `Entre ${formatCurrency(MIN_LIMIT, 'XOF')} et ${formatCurrency(MAX_LIMIT, 'XOF')}`
              : <span className="text-red-600">Entre {formatCurrency(MIN_LIMIT, 'XOF')} et {formatCurrency(MAX_LIMIT, 'XOF')}</span>
          }
        />
        <Button type="submit" className="w-full" disabled={!valid}>
          Enregistrer
        </Button>
      </form>
    </Sheet>
  );
};
