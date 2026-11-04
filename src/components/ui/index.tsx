/* eslint-disable react-refresh/only-export-components */
import React, { useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

/*
 * Boîte à outils Payzed — un seul style partout.
 *  Titre d'écran 26px · Titre de section 17px · Texte 15px · Légende 13px
 *  Bouton principal noir 56px · Bouton secondaire gris · Champs 56px
 */

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ---------- Typographie ---------- */

export const PageTitle: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <div className="flex items-center justify-between gap-3 min-h-10">
    <h1 className="text-[26px] leading-tight font-extrabold tracking-tight">{children}</h1>
    {action}
  </div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <div className="flex items-center justify-between gap-3">
    <h2 className="text-[17px] font-bold">{children}</h2>
    {action}
  </div>
);

/* ---------- Boutons ---------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'lg' | 'md';
  icon?: React.ReactNode;
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'lg', icon, className, children, type = 'button', ...rest }) => (
  <button
    type={type}
    className={cx(
      'inline-flex items-center justify-center gap-2 rounded-full font-bold transition-transform active:scale-[0.97] disabled:active:scale-100',
      size === 'lg' ? 'h-14 px-6 text-[15px]' : 'h-11 px-5 text-sm',
      variant === 'primary' && 'bg-black text-white disabled:bg-neutral-200 disabled:text-neutral-400',
      variant === 'secondary' && 'bg-neutral-100 text-black disabled:text-neutral-400',
      variant === 'danger' && 'bg-red-50 text-red-600',
      variant === 'ghost' && 'text-black',
      className,
    )}
    {...rest}
  >
    {icon}
    {children}
  </button>
);

export const TextLink: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, ...rest }) => (
  <button type="button" className={cx('text-sm font-bold text-black py-2 active:opacity-60', className)} {...rest}>
    {children}
  </button>
);

/* ---------- Champs ---------- */

const fieldBase =
  'w-full h-14 px-4 rounded-2xl bg-neutral-100 border-2 border-transparent text-[16px] font-semibold text-black placeholder:text-neutral-400 placeholder:font-medium focus:outline-none focus:border-black focus:bg-white transition-colors';

export const Field: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string | false }> = ({
  label,
  hint,
  error,
  className,
  ...rest
}) => (
  <label className="block">
    {label && <span className="block text-[13px] font-semibold text-neutral-500 mb-1.5 px-1">{label}</span>}
    <input className={cx(fieldBase, error && 'border-red-500 focus:border-red-500', className)} aria-invalid={Boolean(error)} {...rest} />
    {error ? (
      <span className="block text-[13px] text-red-600 mt-1.5 px-1">{error}</span>
    ) : (
      hint && <span className="block text-[13px] text-neutral-500 mt-1.5 px-1">{hint}</span>
    )}
  </label>
);

/** Formate « 25000 » en « 25 000 » pendant la saisie. */
export const groupDigits = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const parseAmount = (value: string) => Number(value.replace(/\D/g, '')) || 0;

export const AmountField: React.FC<{
  value: string;
  onChange: (v: string) => void;
  label?: string;
  hint?: React.ReactNode;
  autoFocus?: boolean;
}> = ({ value, onChange, label = 'Montant', hint, autoFocus }) => (
  <label className="block">
    <span className="block text-[13px] font-semibold text-neutral-500 mb-1.5 px-1">{label}</span>
    <span className="flex items-center h-16 px-4 rounded-2xl bg-neutral-100 border-2 border-transparent focus-within:border-black focus-within:bg-white transition-colors">
      <input
        inputMode="numeric"
        enterKeyHint="done"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder="0"
        value={groupDigits(value.replace(/\D/g, ''))}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
        className="flex-1 min-w-0 bg-transparent text-[28px] font-extrabold tracking-tight placeholder:text-neutral-300 focus:outline-none"
      />
      <span className="text-[15px] font-bold text-neutral-400 shrink-0">FCFA</span>
    </span>
    {hint && <span className="block text-[13px] text-neutral-500 mt-1.5 px-1">{hint}</span>}
  </label>
);

/** Récapitulatif des frais (1 %) sous un montant. */
export const FeeSummary: React.FC<{ amount: number; fee: number; balance: number }> = ({ amount, fee, balance }) => {
  const total = amount + fee;
  const over = total > balance;
  return (
    <div className="rounded-2xl bg-neutral-100 px-4 py-3 space-y-1.5 text-[15px]">
      <div className="flex justify-between text-neutral-500">
        <span>Frais (1 %)</span>
        <span className="font-semibold text-black tabular-nums">{groupDigits(String(fee))} FCFA</span>
      </div>
      <div className="flex justify-between">
        <span className="font-semibold">Total débité</span>
        <span className={cx('font-bold tabular-nums', over && 'text-red-600')}>{groupDigits(String(total))} FCFA</span>
      </div>
      {over && <p className="text-[13px] text-red-600">Solde insuffisant (frais compris)</p>}
    </div>
  );
};

/* ---------- Surfaces & listes ---------- */

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cx('rounded-3xl bg-neutral-100 p-4', className)}>{children}</div>
);

export const List: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cx('rounded-3xl bg-neutral-100 divide-y divide-white overflow-hidden', className)}>{children}</div>
);

export const IconBox: React.FC<{ children: React.ReactNode; dark?: boolean; className?: string }> = ({ children, dark, className }) => (
  <span
    className={cx(
      'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0',
      dark ? 'bg-black text-white' : 'bg-white text-black',
      className,
    )}
  >
    {children}
  </span>
);

export const Row: React.FC<{
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
}> = ({ icon, title, subtitle, trailing, onClick }) => {
  const inner = (
    <>
      {icon}
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[15px] font-semibold truncate">{title}</span>
        {subtitle && <span className="block text-[13px] text-neutral-500 truncate mt-0.5">{subtitle}</span>}
      </span>
      {trailing}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-neutral-200/60 transition-colors">
      {inner}
    </button>
  ) : (
    <div className="flex items-center gap-3 px-4 py-3.5">{inner}</div>
  );
};

export const Toggle: React.FC<{ on: boolean; onChange: () => void; label: string }> = ({ on, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onChange}
    className={cx('w-[52px] h-8 rounded-full p-1 shrink-0 transition-colors', on ? 'bg-black' : 'bg-neutral-300')}
  >
    <span className={cx('block w-6 h-6 rounded-full bg-white shadow-sm transition-transform', on && 'translate-x-5')} />
  </button>
);

export const ProgressBar: React.FC<{ value: number; className?: string; inverted?: boolean }> = ({ value, className, inverted }) => (
  <div className={cx('h-2 rounded-full overflow-hidden', inverted ? 'bg-white/20' : 'bg-neutral-200', className)}>
    <div
      className={cx('h-full rounded-full transition-[width] duration-500', inverted ? 'bg-white' : 'bg-black')}
      style={{ width: `${value > 0 ? Math.max(2, Math.min(100, value)) : 0}%` }}
    />
  </div>
);

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex p-1 rounded-full bg-neutral-100">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cx(
            'flex-1 h-9 px-3 rounded-full text-sm font-bold transition-colors',
            value === o.id ? 'bg-white text-black shadow-sm' : 'text-neutral-500',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Choix parmi quelques options avec logo (opérateur, facture, canal…). */
export function ChoiceGrid<T extends string>({
  value,
  options,
  onChange,
  columns,
}: {
  value: T;
  options: { id: T; label: string; icon: React.ReactNode }[];
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            className={cx(
              'relative h-[84px] rounded-2xl border-2 flex flex-col items-center justify-center gap-2 text-[13px] font-semibold transition-colors',
              active ? 'border-black bg-white' : 'border-transparent bg-neutral-100 text-neutral-700',
            )}
          >
            {o.icon}
            <span className="truncate max-w-full px-1">{o.label}</span>
            {active && (
              <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center">
                <Check className="w-3 h-3" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Vérification avant exécution ---------- */

/**
 * Récapitulatif d'une opération financière avant validation.
 * Le bouton est verrouillé dès le premier appui : impossible d'exécuter deux fois.
 */
export const ReviewView: React.FC<{
  amount: string;
  caption?: string;
  rows: [string, React.ReactNode][];
  confirmLabel: string;
  onConfirm: () => void;
  onEdit: () => void;
}> = ({ amount, caption, rows, confirmLabel, onConfirm, onEdit }) => {
  const [busy, setBusy] = useState(false);
  const fired = useRef(false);
  const confirm = () => {
    if (fired.current) return;
    fired.current = true;
    setBusy(true);
    // Court temps de traitement : retour visuel clair, et aucun double déclenchement possible
    setTimeout(onConfirm, 700);
  };
  return (
    <div className="space-y-5">
      <div className="text-center pt-1">
        <p className="text-[13px] font-semibold text-neutral-500">{caption ?? 'Vous allez payer'}</p>
        <p className="text-[32px] font-extrabold tracking-tight">{amount}</p>
      </div>
      <List>
        {rows.map(([k, v]) => (
          <Row key={k} title={<span className="text-neutral-500 font-medium">{k}</span>} trailing={<span className="text-[15px] font-semibold text-right max-w-[62%] break-words">{v}</span>} />
        ))}
      </List>
      <div className="space-y-2">
        <Button className="w-full" onClick={confirm} disabled={busy} icon={busy ? <Loader2 className="w-5 h-5 animate-spin" /> : undefined}>
          {busy ? 'Traitement…' : confirmLabel}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onEdit} disabled={busy}>
          Modifier
        </Button>
      </div>
    </div>
  );
};

/* ---------- Écran de confirmation ---------- */

export const SuccessView: React.FC<{ amount: string; text: string; onDone: () => void }> = ({ amount, text, onDone }) => (
  <div className="pt-4 pb-2 text-center">
    <span className="w-20 h-20 mx-auto rounded-full bg-black text-white flex items-center justify-center animate-pop">
      <Check className="w-10 h-10" strokeWidth={3} />
    </span>
    <p className="mt-5 text-[32px] font-extrabold tracking-tight">{amount}</p>
    <p className="mt-1 text-[15px] text-neutral-500">{text}</p>
    <Button className="w-full mt-8" onClick={onDone}>
      Terminé
    </Button>
  </div>
);

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; text?: string; action?: React.ReactNode }> = ({
  icon,
  title,
  text,
  action,
}) => (
  <div className="py-10 text-center flex flex-col items-center">
    <span className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">{icon}</span>
    <p className="mt-4 text-[15px] font-bold">{title}</p>
    {text && <p className="mt-1 text-[13px] text-neutral-500 max-w-[260px]">{text}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
