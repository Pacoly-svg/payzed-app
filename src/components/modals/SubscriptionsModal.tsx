import React, { useState } from 'react';
import { 
  X, 
  Repeat, 
  Tv, 
  Headphones, 
  Sparkles, 
  Shield, 
  Wifi, 
  Plus
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { BrandLogo } from '../common/BrandLogo';

const ICON_MAP: Record<string, React.ElementType> = {
  Tv,
  Headphones,
  Sparkles,
  Shield,
  Wifi,
};

export const SubscriptionsModal: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    subscriptions, 
    toggleSubscription, 
    addSubscription, 
    currency, 
    addTransaction,
    triggerNotification,
    showToast
  } = useBanking();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPresetBrand, setSelectedPresetBrand] = useState<string>('spotify');
  const [newName, setNewName] = useState('Spotify Premium');
  const [newAmount, setNewAmount] = useState('3500');
  const [payImmediately, setPayImmediately] = useState(true);

  if (activeModal !== 'subscriptions') return null;

  const totalMonthly = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.amount, 0);

  const popularServices = [
    { name: 'Spotify Premium', brand: 'spotify', defaultAmount: '3500' },
    { name: 'ChatGPT Plus', brand: 'chatgpt', defaultAmount: '13000' },
    { name: 'Claude Pro', brand: 'claude', defaultAmount: '13000' },
    { name: 'Google Gemini Pro', brand: 'gemini', defaultAmount: '13000' },
    { name: 'Netflix Standard', brand: 'netflix', defaultAmount: '6500' },
  ];

  const handleSelectServicePreset = (svc: typeof popularServices[0]) => {
    setSelectedPresetBrand(svc.brand);
    setNewName(svc.name);
    setNewAmount(currency === 'XOF' ? svc.defaultAmount : (parseFloat(svc.defaultAmount) / 655).toFixed(2));
  };

  const handlePayNow = (sub: typeof subscriptions[0]) => {
    const brandKey = sub.name.toLowerCase().includes('chatgpt')
      ? 'chatgpt'
      : sub.name.toLowerCase().includes('claude')
      ? 'claude'
      : sub.name.toLowerCase().includes('gemini')
      ? 'gemini'
      : sub.name.toLowerCase().includes('spotify')
      ? 'spotify'
      : sub.name.toLowerCase().includes('netflix')
      ? 'netflix'
      : sub.name.toLowerCase().includes('rapido')
      ? 'rapido'
      : sub.name.toLowerCase().includes('axa')
      ? 'axa'
      : undefined;

    addTransaction({
      title: `${sub.name}`,
      subtitle: `Règlement d'abonnement (${sub.provider})`,
      category: 'Abonnements',
      type: 'subscription',
      amount: -sub.amount,
      currency,
      status: 'completed',
      icon: sub.iconName,
      brandLogo: brandKey,
      fee: 0,
      paymentMethod: 'Carte Payzed Black',
    });

    triggerNotification({
      title: `Abonnement réglé (-${sub.amount.toLocaleString()} ${currency})`,
      message: `Votre abonnement ${sub.name} de ${sub.amount.toLocaleString()} ${currency} a été payé avec succès.`,
      brandLogo: brandKey,
      amount: -sub.amount,
      type: 'out',
    });

    triggerSuccessConfetti();
    showToast(`Abonnement ${sub.name} payé avec succès`);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newAmount);
    if (!newName || isNaN(amt) || amt <= 0) return;

    addSubscription({
      name: newName,
      provider: newName,
      amount: amt,
      currency,
      billingCycle: 'monthly',
      nextBillingDate: '28 Nov 2026',
      category: 'Abonnement',
      status: 'active',
      iconName: 'Tv',
    });

    if (payImmediately) {
      addTransaction({
        title: `${newName}`,
        subtitle: `Prélèvement initial abonnement`,
        category: 'Abonnements',
        type: 'subscription',
        amount: -amt,
        currency,
        status: 'completed',
        icon: 'Tv',
        brandLogo: selectedPresetBrand || undefined,
        fee: 0,
        paymentMethod: 'Carte Payzed Black',
      });

      triggerNotification({
        title: `Paiement d'abonnement (-${amt.toLocaleString()} ${currency})`,
        message: `Paiement de ${amt.toLocaleString()} ${currency} pour ${newName} confirmé par notification push.`,
        brandLogo: selectedPresetBrand || undefined,
        amount: -amt,
        type: 'out',
      });
    }

    triggerSuccessConfetti();
    showToast(`Abonnement ${newName} ${payImmediately ? 'payé et ' : ''}enregistré`);
    setShowAddForm(false);
    setNewName('');
    setNewAmount('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-neutral-200 text-black overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* En-tête Monochrome */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black">
              <Repeat className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-black">Abonnements & Services</h2>
              <p className="text-[10px] text-neutral-500 font-medium">Prélèvements récurrents automatiques</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barre de budget mensuel */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
              Budget Mensuel Actif
            </span>
            <span className="text-base sm:text-lg font-black font-sans text-black tracking-tight">
              {formatCurrency(totalMonthly, currency)}
              <span className="text-xs font-semibold text-neutral-400 font-sans ml-1">/ mois</span>
            </span>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Ajouter</span>
          </button>
        </div>

        {/* Liste des abonnements */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {showAddForm && (
            <form onSubmit={handleAddSubmit} className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3 mb-3">
              <div>
                <h4 className="text-xs font-bold text-black mb-1.5">Payer un abonnement & Enregistrer</h4>
                <p className="text-[10px] text-neutral-500 font-medium">Sélectionnez le service pour afficher son logo authentique :</p>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {popularServices.map((svc) => (
                    <button
                      key={svc.brand}
                      type="button"
                      onClick={() => handleSelectServicePreset(svc)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all text-left ${
                        selectedPresetBrand === svc.brand
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-800'
                      }`}
                    >
                      <BrandLogo brand={svc.brand} size={22} className="rounded-lg shrink-0" />
                      <span className="truncate text-[11px]">{svc.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  Nom du service
                </label>
                <input
                  type="text"
                  placeholder="Nom du service (ex: Spotify, iCloud)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-300 text-black text-xs focus:outline-none focus:border-black font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  Montant ({currency})
                </label>
                <input
                  type="number"
                  placeholder={`Montant (${currency})`}
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-300 text-black font-mono text-xs focus:outline-none focus:border-black font-bold"
                  required
                />
              </div>

              <label className="flex items-center space-x-2 p-2 rounded-xl bg-white border border-neutral-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={payImmediately}
                  onChange={(e) => setPayImmediately(e.target.checked)}
                  className="rounded text-black focus:ring-black accent-black"
                />
                <span className="text-[11px] font-bold text-neutral-800">
                  Débiter immédiatement & recevoir la notification push
                </span>
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2 rounded-xl bg-neutral-200 text-neutral-800 text-xs font-bold hover:bg-neutral-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  Valider & Payer
                </button>
              </div>
            </form>
          )}

          {subscriptions.map((sub) => {
            const Icon = ICON_MAP[sub.iconName] || Tv;
            const isActive = sub.status === 'active';
            const brandKey = sub.name.toLowerCase().includes('chatgpt')
              ? 'chatgpt'
              : sub.name.toLowerCase().includes('claude')
              ? 'claude'
              : sub.name.toLowerCase().includes('gemini')
              ? 'gemini'
              : sub.name.toLowerCase().includes('spotify')
              ? 'spotify'
              : sub.name.toLowerCase().includes('netflix')
              ? 'netflix'
              : sub.name.toLowerCase().includes('rapido')
              ? 'rapido'
              : sub.name.toLowerCase().includes('axa')
              ? 'axa'
              : null;

            return (
              <div
                key={sub.id}
                className="p-3.5 rounded-2xl bg-white border border-neutral-200/90 hover:border-black/20 shadow-xs transition-all space-y-2.5"
              >
                {/* 1ère ligne : Logo, Nom du service & PRIX CLAIR (Sans encombrement) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    {brandKey ? (
                      <BrandLogo brand={brandKey} size={36} className="rounded-xl shadow-xs shrink-0" />
                    ) : (
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-neutral-100 text-black border border-neutral-200' : 'bg-neutral-100 text-neutral-400'
                      }`}>
                        <Icon className="w-4 h-4 stroke-[2]" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-black truncate">{sub.name}</h4>
                      <p className="text-[10px] sm:text-[11px] text-neutral-500 font-medium truncate mt-0.5">
                        {sub.category}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black font-sans text-black tracking-tight block whitespace-nowrap">
                      {formatCurrency(sub.amount, currency)}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium block">
                      par mois
                    </span>
                  </div>
                </div>

                {/* 2ème ligne : Échéance + Actions claires */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-neutral-100 text-neutral-800' : 'bg-neutral-100 text-neutral-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-black' : 'bg-neutral-400'}`} />
                    <span>{isActive ? `Prochain : ${sub.nextBillingDate}` : 'En pause'}</span>
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => toggleSubscription(sub.id)}
                      className="px-2.5 py-1 rounded-xl border border-neutral-200 hover:border-black text-neutral-700 hover:text-black text-[11px] font-semibold transition-all active:scale-95 bg-white"
                    >
                      {isActive ? 'Suspendre' : 'Reprendre'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePayNow(sub)}
                      className="px-3 py-1 rounded-xl bg-black hover:bg-neutral-800 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95"
                    >
                      Régler
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
