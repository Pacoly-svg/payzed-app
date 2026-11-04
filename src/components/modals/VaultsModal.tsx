import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  Plus
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { haptic } from '../../utils/haptics';
import { AppleEmoji, POPULAR_VAULT_EMOJIS, EXTENDED_VAULT_EMOJIS } from '../common/AppleEmoji';

export const VaultsModal: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    vaults, 
    balance, 
    currency, 
    depositToVault, 
    withdrawFromVault, 
    toggleVaultLock, 
    createVault,
    showToast 
  } = useBanking();

  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [transferAmount, setTransferAmount] = useState<string>('50000');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // New Vault form
  const [newVaultName, setNewVaultName] = useState('');
  const [newVaultTarget, setNewVaultTarget] = useState('1000000');
  const [newVaultEmoji, setNewVaultEmoji] = useState('🎯');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customEmojiInput, setCustomEmojiInput] = useState('');

  if (activeModal !== 'vaults') return null;

  const totalVaultSavings = vaults.reduce((sum, v) => sum + v.currentAmount, 0);

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVaultId) return;

    const parsed = parseFloat(transferAmount.replace(/\s+/g, ''));
    if (isNaN(parsed) || parsed <= 0) {
      showToast('Montant invalide');
      return;
    }

    if (actionType === 'deposit') {
      if (parsed > balance) {
        haptic.warning();
        showToast('Solde disponible insuffisant');
        return;
      }
      haptic.success();
      depositToVault(selectedVaultId, parsed);
      triggerSuccessConfetti();
    } else {
      const v = vaults.find(vault => vault.id === selectedVaultId);
      if (v?.isLocked) {
        haptic.warning();
        showToast('Ce coffre est verrouillé');
        return;
      }
      if (v && parsed > v.currentAmount) {
        haptic.warning();
        showToast('Fonds insuffisants dans le coffre');
        return;
      }
      haptic.success();
      withdrawFromVault(selectedVaultId, parsed);
    }

    setSelectedVaultId(null);
    setTransferAmount('50000');
  };

  const handleCreateNewVault = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVaultName.trim()) return;

    const parsedTarget = parseFloat(newVaultTarget.replace(/\s+/g, ''));
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      showToast('Objectif de montant invalide');
      return;
    }

    haptic.success();
    createVault({
      name: newVaultName.trim(),
      targetAmount: parsedTarget,
      emoji: newVaultEmoji || '🎯',
      isLocked: false,
      color: '#000000',
    });

    triggerSuccessConfetti();
    setIsCreating(false);
    setNewVaultName('');
    setNewVaultTarget('1000000');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-neutral-200 text-black overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-black">Coffres & Épargne Payzed</h2>
              <p className="text-[10px] text-neutral-500 font-medium">Sous-comptes protégés de la carte</p>
            </div>
          </div>

          <button
            onClick={() => {
              haptic.light();
              setActiveModal(null);
            }}
            className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Synthèse Trésorerie Coffres */}
        <div className="p-4 bg-neutral-950 text-white flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block font-mono">
              Total épargné dans les coffres
            </span>
            <span className="text-lg font-black font-sans text-white tracking-tight">
              {formatCurrency(totalVaultSavings, currency)}
            </span>
          </div>

          <button
            onClick={() => {
              haptic.selection();
              setIsCreating(!isCreating);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Créer un coffre</span>
          </button>
        </div>

        {/* Corps déroulant */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          
          {/* Formulaire Création de Coffre - Ergonomie Haute Précision */}
          {isCreating && (
            <form onSubmit={handleCreateNewVault} className="p-4 rounded-3xl bg-neutral-50 border border-neutral-200/90 space-y-3.5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-200/60">
                <div>
                  <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                    Nouveau Coffre d'Épargne
                  </h4>
                  <p className="text-[10px] text-neutral-500 font-medium">Fonds protégés des débits de carte</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="p-1 rounded-xl text-neutral-400 hover:text-black hover:bg-neutral-200/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bloc 1: Icône active interactive & Nom de l'objectif */}
              <div className="flex items-center space-x-3">
                <div 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="relative w-12 h-12 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-300 hover:border-black flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 shadow-2xs group"
                  title="Cliquer pour changer l'émoji"
                >
                  <AppleEmoji emoji={newVaultEmoji} size={28} />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold shadow-xs group-hover:scale-110 transition-transform">
                    +
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Nom de l'objectif
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Projet Saly, Réserve..."
                    value={newVaultName}
                    onChange={(e) => setNewVaultName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-300 text-xs text-black font-semibold focus:outline-none focus:border-black h-10"
                    required
                  />
                </div>
              </div>

              {/* Bloc 2: Montant cible (Pleine largeur avec symbole monétaire) */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Montant de l'objectif ({currency})
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={newVaultTarget}
                    onChange={(e) => setNewVaultTarget(e.target.value)}
                    className="w-full pl-3 pr-14 py-2 rounded-xl bg-white border border-neutral-300 text-xs text-black font-bold focus:outline-none focus:border-black font-mono h-10"
                    placeholder="1000000"
                    required
                  />
                  <span className="absolute right-3 text-xs font-mono font-bold text-neutral-400 select-none">
                    {currency}
                  </span>
                </div>
              </div>

              {/* Bloc 3: Sélection de l'Émoji (Pleine largeur, grille aérée) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Émoji
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-[10px] font-bold text-neutral-600 hover:text-black flex items-center space-x-1"
                  >
                    <span>{showEmojiPicker ? 'Masquer' : 'Voir tout'}</span>
                  </button>
                </div>

                {/* 6 boutons émojis élégants alignés horizontalement */}
                <div className="grid grid-cols-6 gap-1.5">
                  {POPULAR_VAULT_EMOJIS.slice(0, 5).map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setNewVaultEmoji(em);
                      }}
                      className={`h-9 rounded-xl flex items-center justify-center border transition-all ${
                        newVaultEmoji === em ? 'border-black bg-white shadow-xs scale-105 ring-2 ring-black/10' : 'border-neutral-200 bg-white hover:bg-neutral-100'
                      }`}
                    >
                      <AppleEmoji emoji={em} size={20} />
                    </button>
                  ))}

                  {/* Bouton "+" pour ouvrir/fermer la grille complète */}
                  <button
                    type="button"
                    onClick={() => {
                      haptic.light();
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    className={`h-9 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${
                      showEmojiPicker 
                        ? 'border-black bg-black text-white shadow-xs' 
                        : 'border-dashed border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700'
                    }`}
                    title="Tous les émojis"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Panneau pleine largeur pour afficher tous les émojis */}
              {showEmojiPicker && (
                <div className="p-3 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Tous les émojis
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(false)}
                      className="text-[10px] font-bold text-neutral-400 hover:text-black"
                    >
                      Fermer
                    </button>
                  </div>

                  <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-neutral-50 rounded-xl border border-neutral-200/60">
                    {EXTENDED_VAULT_EMOJIS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setNewVaultEmoji(em);
                          setShowEmojiPicker(false);
                        }}
                        className={`h-9 rounded-xl flex items-center justify-center border transition-all ${
                          newVaultEmoji === em ? 'border-black bg-white shadow-xs scale-105 ring-2 ring-black/10' : 'border-transparent hover:bg-white hover:border-neutral-200'
                        }`}
                      >
                        <AppleEmoji emoji={em} size={20} />
                      </button>
                    ))}
                  </div>

                  {/* Saisie d'émoji personnalisé libre */}
                  <div className="flex items-center space-x-1.5 pt-1 border-t border-neutral-100">
                    <input
                      type="text"
                      value={customEmojiInput}
                      onChange={(e) => setCustomEmojiInput(e.target.value)}
                      placeholder="Ou coller un émoji..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-none focus:border-black font-semibold"
                    />
                    <button
                      type="button"
                      disabled={!customEmojiInput.trim()}
                      onClick={() => {
                        if (customEmojiInput.trim()) {
                          setNewVaultEmoji(customEmojiInput.trim());
                          setCustomEmojiInput('');
                          setShowEmojiPicker(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold disabled:opacity-40 shrink-0"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.99]"
              >
                Créer et activer le coffre
              </button>
            </form>
          )}

          {/* Formulaire Modal de Dépot / Retrait */}
          {selectedVaultId && (
            <form onSubmit={handleExecuteTransfer} className="p-4 rounded-2xl bg-black text-white space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{actionType === 'deposit' ? 'Ajouter des fonds' : 'Récupérer des fonds'}</span>
                  <span>•</span>
                  {(() => {
                    const sv = vaults.find(v => v.id === selectedVaultId);
                    return (
                      <span className="flex items-center gap-1">
                        {sv && <AppleEmoji emoji={sv.emoji} size={14} />}
                        <span>{sv?.name}</span>
                      </span>
                    );
                  })()}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedVaultId(null)}
                  className="p-1 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-neutral-900 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setActionType('deposit')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    actionType === 'deposit' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Déposer (+)
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('withdraw')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    actionType === 'withdraw' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Retirer (-)
                </button>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold font-mono">Montant</span>
                  <span className="text-[10px] text-neutral-300">
                    {actionType === 'deposit' 
                      ? `Dispo compte : ${formatCurrency(balance, currency)}` 
                      : `Dans le coffre : ${formatCurrency(vaults.find(v => v.id === selectedVaultId)?.currentAmount || 0, currency)}`}
                  </span>
                </div>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-bold text-sm focus:outline-none focus:border-white font-sans"
                  placeholder="Montant..."
                  required
                />
              </div>

              <div className="flex gap-1.5">
                {[50000, 100000, 250000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setTransferAmount(quick.toString())}
                    className="flex-1 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10px] font-bold text-neutral-200 transition-colors"
                  >
                    +{quick / 1000}k
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs shadow-xs transition-all active:scale-95"
              >
                Confirmer l'opération
              </button>
            </form>
          )}

          {/* Liste des Coffres */}
          <div className="space-y-2.5">
            {vaults.map((vault) => {
              const progress = Math.min(100, Math.round((vault.currentAmount / vault.targetAmount) * 100));

              return (
                <div
                  key={vault.id}
                  className="p-3.5 rounded-2xl bg-white border border-neutral-200/90 hover:border-black/20 shadow-xs transition-all space-y-2.5"
                >
                  {/* Top line : Emoji, Name, Target % & Lock button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 shadow-2xs">
                        <AppleEmoji emoji={vault.emoji} size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-xs sm:text-sm font-bold text-black truncate">{vault.name}</h4>
                          {vault.isLocked && (
                            <span className="p-0.5 rounded bg-neutral-100 text-black" title="Verrouillé">
                              <Lock className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-500 font-medium">
                          Objectif : {formatCurrency(vault.targetAmount, currency)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-black font-sans text-black block tracking-tight">
                        {formatCurrency(vault.currentAmount, currency)}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-bold block">
                        {progress}% atteint
                      </span>
                    </div>
                  </div>

                  {/* Barre de Progression */}
                  <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden border border-neutral-200/60">
                    <div 
                      className="h-full bg-black rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Boutons d'Action Rapide */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        toggleVaultLock(vault.id);
                      }}
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                        vault.isLocked 
                          ? 'bg-neutral-100 border-neutral-300 text-black' 
                          : 'bg-white border-neutral-200 text-neutral-500 hover:text-black'
                      }`}
                    >
                      {vault.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span>{vault.isLocked ? 'Verrouillé' : 'Déverrouillé'}</span>
                    </button>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setSelectedVaultId(vault.id);
                          setActionType('deposit');
                        }}
                        className="px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-[11px] border border-neutral-200 transition-all active:scale-95"
                      >
                        + Déposer
                      </button>

                      <button
                        type="button"
                        disabled={vault.isLocked}
                        onClick={() => {
                          haptic.selection();
                          setSelectedVaultId(vault.id);
                          setActionType('withdraw');
                        }}
                        className={`px-2.5 py-1 rounded-xl font-bold text-[11px] border transition-all active:scale-95 ${
                          vault.isLocked 
                            ? 'opacity-40 cursor-not-allowed bg-neutral-50 border-neutral-200 text-neutral-400' 
                            : 'bg-black hover:bg-neutral-800 text-white border-black'
                        }`}
                      >
                        - Retirer
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};
