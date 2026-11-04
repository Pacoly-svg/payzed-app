import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { BrandLogo } from '../common/BrandLogo';

export const BillsModal: React.FC = () => {
  const { activeModal, setActiveModal, currency, balance, addTransaction, showToast } = useBanking();
  
  const [billCategory, setBillCategory] = useState<'senelec' | 'seneau' | 'rapido' | 'axa' | 'dgid'>('senelec');
  const [billReference, setBillReference] = useState('');
  const [amount, setAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (activeModal !== 'bills') return null;

  const billPresets = [
    {
      id: 'senelec' as const,
      title: 'Senelec',
      subtitle: 'Facture d\'électricité mensuelle',
      brand: 'senelec',
      defaultRecipient: 'Senelec SA',
      defaultAmount: '45000',
      placeholderRef: 'N° Police / Facture Senelec',
      category: 'Logement & Factures' as const,
    },
    {
      id: 'seneau' as const,
      title: 'Sen\'Eau',
      subtitle: 'Distribution eau potable Sénégal',
      brand: 'seneau',
      defaultRecipient: 'Sen\'Eau Direction Commerciale',
      defaultAmount: '18500',
      placeholderRef: 'N° Contrat d\'abonnement eau',
      category: 'Logement & Factures' as const,
    },
    {
      id: 'rapido' as const,
      title: 'Rapido',
      subtitle: 'Badge Autoroute de l\'Avenir Dakar',
      brand: 'rapido',
      defaultRecipient: 'SECAA Eiffage Autoroute Dakar',
      defaultAmount: '20000',
      placeholderRef: 'N° Badge Rapido (ex: 290145)',
      category: 'Transport & Mobilité' as const,
    },
    {
      id: 'dgid' as const,
      title: 'DGID Impôts & Domaines',
      subtitle: 'Taxes, foncier & impôt sur le revenu',
      brand: 'dgid',
      defaultRecipient: 'Direction Générale des Impôts Sénégal',
      defaultAmount: '65000',
      placeholderRef: 'N° NINEA / Réf. Avis d\'imposition',
      category: 'Services & Abonnements' as const,
    },
    {
      id: 'axa' as const,
      title: 'AXA Assurances',
      subtitle: 'Assurance Auto & Santé Sénégal',
      brand: 'axa',
      defaultRecipient: 'AXA Assurances Sénégal SA',
      defaultAmount: '35000',
      placeholderRef: 'N° Police d\'assurance AXA',
      category: 'Services & Abonnements' as const,
    },
  ];

  const currentPreset = billPresets.find((b) => b.id === billCategory) || billPresets[0];

  const handleSelectPreset = (id: typeof billCategory) => {
    setBillCategory(id);
    const selected = billPresets.find((b) => b.id === id);
    if (selected) {
      setRecipientName(selected.defaultRecipient);
      setAmount(selected.defaultAmount);
    }
  };

  const handlePayBill = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(/\s+/g, ''));
    if (isNaN(parsed) || parsed <= 0) return;

    if (parsed > balance) {
      showToast('Solde disponible insuffisant');
      return;
    }

    addTransaction({
      title: currentPreset.title,
      subtitle: `${recipientName || currentPreset.defaultRecipient} • ${billReference || 'Règlement direct'}`,
      category: currentPreset.category,
      type: 'bill',
      amount: -parsed,
      currency,
      status: 'completed',
      icon: billCategory === 'senelec' ? 'Zap' : billCategory === 'seneau' ? 'Droplets' : billCategory === 'rapido' ? 'CreditCard' : 'Shield',
      brandLogo: currentPreset.brand,
      recipient: recipientName || currentPreset.defaultRecipient,
      fee: 0,
      paymentMethod: 'Compte Payzed Sénégal',
    });

    setIsSuccess(true);
    triggerSuccessConfetti();
  };

  const handleClose = () => {
    setIsSuccess(false);
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-neutral-200 text-black overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black">
              <FileText className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-black">Factures & Services Sénégal</h2>
              <p className="text-[10px] text-neutral-500 font-medium">Paiement certifié instantané</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-4 overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            
            <div>
              <h3 className="text-lg font-extrabold text-black tracking-tight">Paiement Validé</h3>
              <p className="text-xs text-neutral-500 font-medium mt-1">
                Votre règlement de <span className="font-bold text-black">{amount} {currency}</span> auprès de <span className="font-semibold text-black">{currentPreset.title}</span> a été confirmé.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 rounded-2xl bg-black text-white font-bold text-xs shadow-md hover:bg-neutral-800 transition-all"
            >
              Terminer et retourner à l'accueil
            </button>
          </div>
        ) : (
          <form onSubmit={handlePayBill} className="p-5 space-y-3.5 overflow-y-auto">
            {/* Service Selection List with Brand Logos */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                Sélectionnez l'organisme au Sénégal
              </label>
              <div className="space-y-2">
                {billPresets.map((bp) => {
                  const isSelected = billCategory === bp.id;

                  return (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => handleSelectPreset(bp.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-black text-white border-black shadow-sm'
                          : 'bg-white border-neutral-200 text-neutral-800 hover:border-black/30'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <BrandLogo brand={bp.brand} size={36} className="shrink-0" />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-black'}`}>{bp.title}</p>
                          <p className={`text-[10px] truncate ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>{bp.subtitle}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-mono font-bold shrink-0 ml-2 ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                        {bp.defaultAmount} {currency}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                {billCategory === 'rapido' ? 'Numéro de Badge Rapido' : 'Numéro de Contrat / Référence Facture'}
              </label>
              <input
                type="text"
                value={billReference}
                onChange={(e) => setBillReference(e.target.value)}
                placeholder={currentPreset.placeholderRef}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-300 text-black text-xs focus:outline-none focus:border-black font-medium"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Montant à régler ({currency})
              </label>
              <input
                type="number"
                value={amount || currentPreset.defaultAmount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-300 text-black font-mono text-sm focus:outline-none focus:border-black font-semibold"
                required
              />
            </div>

            {/* Confirmation Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] flex items-center justify-center space-x-2 mt-2"
            >
              <span>Valider le règlement</span>
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
