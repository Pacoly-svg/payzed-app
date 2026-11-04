import React, { useState } from 'react';
import { ChevronRight, Eye, EyeOff, Lock, PiggyBank, Plus } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { AppleEmoji, POPULAR_VAULT_EMOJIS } from '../common/AppleEmoji';
import { Sheet } from '../common/Sheet';
import { AmountField, Button, EmptyState, Field, List, ProgressBar, Segmented, Toggle, groupDigits, parseAmount } from '../ui';
import type { VaultItem } from '../../types/banking';

type View = { name: 'list' } | { name: 'detail'; id: string } | { name: 'create' };

const pct = (v: VaultItem) => (v.targetAmount > 0 ? Math.round((v.currentAmount / v.targetAmount) * 100) : 0);

export const VaultsModal: React.FC = () => {
  const { setActiveModal, vaults, isBalanceHidden, toggleHideBalance } = useBanking();
  const [view, setView] = useState<View>({ name: 'list' });
  const close = () => setActiveModal(null);
  const back = () => setView({ name: 'list' });

  if (view.name === 'detail') {
    const vault = vaults.find((v) => v.id === view.id);
    if (vault) return <VaultDetail vault={vault} onBack={back} onClose={close} />;
  }
  if (view.name === 'create') return <VaultCreate onBack={back} onClose={close} onCreated={back} />;

  const total = vaults.reduce((s, v) => s + v.currentAmount, 0);

  return (
    <Sheet title="Épargne" onClose={close}>
      <div className="space-y-5">
        {/* Même présentation que le solde de l'accueil */}
        <section className="rounded-[28px] bg-black text-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400 font-medium">Total épargné</span>
            <button
              type="button"
              onClick={toggleHideBalance}
              aria-label={isBalanceHidden ? 'Afficher les montants' : 'Masquer les montants'}
              className="p-2 -mr-2 rounded-full text-neutral-400 active:bg-white/10"
            >
              {isBalanceHidden ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[clamp(1.75rem,9vw,2.5rem)] font-extrabold tracking-tight leading-tight break-words">
            {isBalanceHidden ? '••••••' : formatCurrency(total, 'XOF')}
          </p>
        </section>

        {vaults.length === 0 ? (
          <EmptyState
            icon={<PiggyBank className="w-6 h-6" />}
            title="Aucun coffre"
            text="Mettez de l'argent de côté pour un projet."
          />
        ) : (
          <List>
            {vaults.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView({ name: 'detail', id: v.id })}
                className="w-full px-4 py-4 flex items-center gap-3 text-left active:bg-neutral-200/60 transition-colors"
              >
                <span className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0">
                  <AppleEmoji emoji={v.emoji} size={28} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold truncate">{v.name}</span>
                    {v.isLocked && <Lock className="w-3.5 h-3.5 text-neutral-500 shrink-0" aria-label="Bloqué" />}
                    <span className="ml-auto text-[13px] font-bold shrink-0">{pct(v)} %</span>
                  </span>
                  <ProgressBar value={pct(v)} className="mt-2 bg-white" />
                  <span className="block text-[13px] text-neutral-500 mt-1.5 truncate">
                    {isBalanceHidden ? (
                      <>Objectif {formatCurrency(v.targetAmount, 'XOF')}</>
                    ) : (
                      <>
                        <span className="font-semibold text-black">{groupDigits(String(v.currentAmount))}</span> sur {formatCurrency(v.targetAmount, 'XOF')}
                      </>
                    )}
                  </span>
                </span>
                <ChevronRight className="w-5 h-5 text-neutral-400 shrink-0" />
              </button>
            ))}
          </List>
        )}

        <Button variant="secondary" className="w-full" icon={<Plus className="w-5 h-5" />} onClick={() => setView({ name: 'create' })}>
          Nouveau coffre
        </Button>
      </div>
    </Sheet>
  );
};

/* ---------- Détail d'un coffre ---------- */

const VaultDetail: React.FC<{ vault: VaultItem; onBack: () => void; onClose: () => void }> = ({ vault, onBack, onClose }) => {
  const { balance, depositToVault, withdrawFromVault, toggleVaultLock, deleteVault, showToast, isBalanceHidden, toggleHideBalance } = useBanking();
  const [mode, setMode] = useState<'add' | 'take'>('add');
  const [amount, setAmount] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const value = parseAmount(amount);
  const p = pct(vault);
  const remaining = Math.max(0, vault.targetAmount - vault.currentAmount);
  const takeBlocked = mode === 'take' && vault.isLocked;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(value > 0)) return showToast('Entrez un montant');
    if (mode === 'add') depositToVault(vault.id, value);
    else withdrawFromVault(vault.id, value);
    setAmount('');
  };

  return (
    <Sheet title={vault.name} onBack={onBack} onClose={onClose}>
      <div className="space-y-6">
        <div className="text-center pt-1">
          <AppleEmoji emoji={vault.emoji} size={48} />
          <div className="mt-3 flex items-center justify-center gap-2">
            <p className="text-[32px] font-extrabold tracking-tight">{isBalanceHidden ? '••••••' : formatCurrency(vault.currentAmount, 'XOF')}</p>
            <button
              type="button"
              onClick={toggleHideBalance}
              aria-label={isBalanceHidden ? 'Afficher le montant' : 'Masquer le montant'}
              className="p-2 rounded-full text-neutral-400 active:bg-neutral-100"
            >
              {isBalanceHidden ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[15px] text-neutral-500">sur un objectif de {formatCurrency(vault.targetAmount, 'XOF')}</p>
          <ProgressBar value={p} className="mt-4" />
          <div className="flex justify-between text-[13px] mt-2">
            <span className="font-bold">{p} %</span>
            <span className="text-neutral-500">{remaining > 0 ? `Reste ${formatCurrency(remaining, 'XOF')}` : 'Objectif atteint'}</span>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Segmented
            value={mode}
            onChange={(m) => {
              setMode(m);
              setAmount('');
            }}
            options={[
              { id: 'add', label: 'Ajouter' },
              { id: 'take', label: 'Retirer' },
            ]}
          />
          {takeBlocked ? (
            <p className="rounded-2xl bg-neutral-100 px-4 py-4 text-[15px] text-neutral-600">
              Ce coffre est bloqué. Désactivez le blocage ci-dessous pour retirer de l'argent.
            </p>
          ) : (
            <>
              <AmountField
                value={amount}
                onChange={setAmount}
                hint={
                  mode === 'add'
                    ? `Disponible sur le compte : ${formatCurrency(balance, 'XOF')}`
                    : `Disponible dans le coffre : ${formatCurrency(vault.currentAmount, 'XOF')}`
                }
              />
              <Button type="submit" className="w-full" disabled={!(value > 0)}>
                {mode === 'add' ? 'Ajouter au coffre' : 'Retirer vers le compte'}
              </Button>
            </>
          )}
        </form>

        <List>
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-semibold">Bloquer les retraits</span>
              <span className="block text-[13px] text-neutral-500 mt-0.5">Pour ne pas toucher à cette épargne</span>
            </span>
            <Toggle on={vault.isLocked} onChange={() => toggleVaultLock(vault.id)} label="Bloquer les retraits" />
          </div>
        </List>

        {confirmDelete ? (
          <div className="rounded-3xl bg-neutral-100 p-4 space-y-3">
            <p className="text-[15px] font-semibold">
              Supprimer ce coffre ?
              {vault.currentAmount > 0 && ` ${formatCurrency(vault.currentAmount, 'XOF')} retourneront sur votre compte.`}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="md" className="flex-1 bg-white" onClick={() => setConfirmDelete(false)}>
                Annuler
              </Button>
              <Button
                size="md"
                className="flex-1 bg-red-600"
                onClick={() => {
                  deleteVault(vault.id);
                  onBack();
                }}
              >
                Supprimer
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="w-full text-red-600" onClick={() => setConfirmDelete(true)}>
            Supprimer le coffre
          </Button>
        )}
      </div>
    </Sheet>
  );
};

/* ---------- Création ---------- */

const VaultCreate: React.FC<{ onBack: () => void; onClose: () => void; onCreated: () => void }> = ({ onBack, onClose, onCreated }) => {
  const { createVault, showToast } = useBanking();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [emoji, setEmoji] = useState(POPULAR_VAULT_EMOJIS[0]);
  const value = parseAmount(target);
  const ready = name.trim().length > 0 && value > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return showToast('Donnez un nom au coffre');
    if (!(value > 0)) return showToast("Entrez l'objectif");
    createVault({ name: name.trim(), targetAmount: value, emoji, isLocked: false, color: '#000000' });
    onCreated();
  };

  return (
    <Sheet title="Nouveau coffre" onBack={onBack} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <p className="text-[13px] font-semibold text-neutral-500 mb-2 px-1">Icône</p>
          <div className="grid grid-cols-5 gap-2">
            {POPULAR_VAULT_EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setEmoji(em)}
                aria-pressed={emoji === em}
                className={`aspect-square rounded-2xl flex items-center justify-center border-2 transition-colors ${
                  emoji === em ? 'border-black bg-white' : 'border-transparent bg-neutral-100'
                }`}
              >
                <AppleEmoji emoji={em} size={28} />
              </button>
            ))}
          </div>
        </div>
        <Field label="Nom du coffre" placeholder="Ex : Voiture, Tabaski, Études" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
        <AmountField label="Objectif" value={target} onChange={setTarget} />
        <Button type="submit" className="w-full" disabled={!ready}>
          Créer le coffre
        </Button>
      </form>
    </Sheet>
  );
};
