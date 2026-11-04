import React, { useState } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  ArrowRight,
  Building2
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { BrandLogo } from '../common/BrandLogo';

export const TransferModal: React.FC = () => {
  const { activeModal, setActiveModal, currency, balance, addTransaction, triggerNotification, showToast, customPlatforms } = useBanking();
  
  const [transferType, setTransferType] = useState<string>('wave');
  const [recipientName, setRecipientName] = useState('Babacar Sy');
  const [recipientIdentifier, setRecipientIdentifier] = useState('+221 77 482 19 02');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (activeModal !== 'transfer') return null;

  const quickContacts = [
    { name: 'Fatou Sow', tag: '@fatou.s', initials: 'FS', phone: '+221 77 319 88 12' },
    { name: 'Cheikh Ndiaye', tag: '@cheikh.n', initials: 'CN', phone: '+221 78 440 21 09' },
    { name: 'Aminata Fall', tag: '@ami.fall', initials: 'AF', phone: '+221 76 512 34 56' },
    { name: 'Ousmane Ba', tag: '@ousmane.ba', initials: 'OB', phone: '+221 70 890 12 34' },
  ];

  const transferRails = [
    { id: 'wave', label: 'Wave', logo: 'wave' },
    { id: 'orange', label: 'Orange Money', logo: 'orange' },
    { id: 'p2p', label: 'Payzed Direct', logo: 'payzed' },
    { id: 'paypal', label: 'PayPal', logo: 'paypal' },
    { id: 'iban', label: 'Virement IBAN', logo: 'iban' },
  ];

  const allRails = [
    ...transferRails,
    ...customPlatforms.map(cp => ({ id: cp.name.toLowerCase(), label: cp.name, logo: cp.logoUrl }))
  ];

  const handleQuickContact = (c: typeof quickContacts[0]) => {
    setRecipientName(c.name);
    setRecipientIdentifier(transferType === 'p2p' ? c.tag : c.phone);
    if (!note) setNote(`Virement à ${c.name}`);
  };

  const getRailName = (id: typeof transferType) => {
    switch (id) {
      case 'wave': return 'Wave';
      case 'orange': return 'Orange Money';
      case 'paypal': return 'PayPal';
      case 'iban': return 'Virement Bancaire (IBAN)';
      default: return 'Payzed Direct';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(/\s+/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Veuillez saisir un montant valide');
      return;
    }

    if (parsedAmount > balance) {
      showToast('Solde disponible insuffisant');
      return;
    }

    const railName = getRailName(transferType);
    const brandLogoKey = transferType === 'p2p' ? undefined : transferType;
    const finalRecipient = recipientName.trim() || 'Bénéficiaire';
    const detailParts = [recipientIdentifier.trim(), recipientEmail.trim()].filter(Boolean);
    const detailString = detailParts.join(' • ');

    addTransaction({
      title: finalRecipient,
      subtitle: note || `${detailString ? detailString + ' via ' : ''}${railName}`,
      category: 'Revenus & Virements',
      type: 'transfer_out',
      amount: -parsedAmount,
      currency,
      status: 'completed',
      icon: 'ArrowUpRight',
      brandLogo: brandLogoKey,
      recipient: `${finalRecipient} (${detailString || railName})`,
      fee: 0,
      paymentMethod: railName,
    });

    triggerNotification({
      title: `Transfert émis (-${parsedAmount.toLocaleString()} ${currency})`,
      message: `Votre virement de ${parsedAmount.toLocaleString()} ${currency} à destination de ${finalRecipient} (${railName}) a été exécuté.`,
      brandLogo: brandLogoKey,
      amount: -parsedAmount,
      type: 'out',
    });

    setIsSuccess(true);
    triggerSuccessConfetti();

    setTimeout(() => {
      setIsSuccess(false);
      setActiveModal(null);
      setRecipientName('Babacar Sy');
      setRecipientIdentifier('');
      setRecipientEmail('');
      setAmount('');
      setNote('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-neutral-200 text-black overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black">
              <Send className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-black">Nouveau Virement & Transfert</h2>
              <p className="text-[10px] text-neutral-500 font-medium">PI-SPI, Banques & Plateformes</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-extrabold text-black tracking-tight">Virement Exécuté</h3>
            <p className="text-xs text-neutral-500 font-medium">
              Le montant de {amount} {currency} a été transféré avec succès via {getRailName(transferType)}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            {/* Mode / Plateforme de transfert */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                Canal de virement
              </label>
              <div className="grid grid-cols-2 gap-2">
                {allRails.map((rail) => {
                  const isSelected = transferType === rail.id;
                  return (
                    <button
                      key={rail.id}
                      type="button"
                      onClick={() => setTransferType(rail.id)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center space-x-2.5 text-left ${
                        isSelected
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800'
                      }`}
                    >
                      {rail.id === 'p2p' ? (
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 p-1.5 shadow-2xs ${
                          isSelected ? 'bg-white' : 'bg-black'
                        }`}>
                          <img 
                            src={isSelected ? "/assets/logo/symbole-couleur.svg" : "/assets/logo/symbole-blanc.svg"} 
                            alt="Payzed" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : rail.id === 'iban' ? (
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-neutral-800 text-white' : 'bg-white border border-neutral-200 text-black'
                        }`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <BrandLogo brand={rail.logo} size={28} className="rounded-xl shrink-0" />
                      )}
                      <span className="text-xs font-bold leading-tight min-w-0 flex-1">{rail.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contacts Fréquents */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Destinataires fréquents
              </p>
              <div className="grid grid-cols-4 gap-2">
                {quickContacts.map((c) => (
                  <button
                    key={c.tag}
                    type="button"
                    onClick={() => handleQuickContact(c)}
                    className="flex flex-col items-center p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition-all text-center group active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 text-black flex items-center justify-center font-bold text-xs tracking-wider shadow-2xs group-hover:bg-black group-hover:text-white transition-colors">
                      {c.initials}
                    </div>
                    <span className="text-[10px] font-bold text-neutral-800 truncate w-full mt-1.5">{c.name.split(' ')[0]}</span>
                    <span className="text-[8px] text-neutral-400 truncate w-full font-mono">{c.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prénom & Nom Réel du Bénéficiaire */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Prénom & Nom du bénéficiaire
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Ex: Babacar Sy"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-300 text-black text-xs focus:outline-none focus:border-black font-semibold"
                required
              />
            </div>

            {/* Coordonnée de Transfert (Téléphone, Tag ou IBAN) */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                {transferType === 'wave' || transferType === 'orange'
                  ? 'Numéro Mobile Money du bénéficiaire'
                  : transferType === 'paypal'
                  ? 'Compte PayPal / Téléphone'
                  : transferType === 'p2p'
                  ? 'Tag Payzed (@tag) ou Téléphone'
                  : 'Coordonnées Bancaires (RIB / IBAN)'}
              </label>
              <input
                type="text"
                value={recipientIdentifier}
                onChange={(e) => setRecipientIdentifier(e.target.value)}
                placeholder={
                  transferType === 'wave' || transferType === 'orange'
                    ? '+221 7X XXX XX XX'
                    : transferType === 'paypal'
                    ? 'client@domaine.com ou +221...'
                    : transferType === 'p2p'
                    ? '@nom.utilisateur'
                    : 'SN08 SN01 0100...'
                }
                className="w-full px-3.5 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-300 text-black text-xs font-mono focus:outline-none focus:border-black font-semibold"
                required
              />
            </div>

            {/* Email Optionnel pour avis d'opération */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Adresse Email (Optionnel)
                </label>
                <span className="text-[9px] text-neutral-400 font-medium">Reçu électronique</span>
              </div>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="destinataire@email.com"
                className="w-full px-3.5 py-2 rounded-2xl bg-neutral-50 border border-neutral-300 text-black text-xs focus:outline-none focus:border-black font-medium"
              />
            </div>

            {/* Montant */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Montant ({currency})
                </label>
                <span className="text-[10px] text-neutral-500 font-medium">
                  Dispo : <span className="font-semibold text-black">{formatCurrency(balance, currency)}</span>
                </span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-300 text-black font-mono text-base font-bold focus:outline-none focus:border-black"
                required
              />
            </div>

            {/* Motif */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Motif (optionnel)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex : Prestation, achat, virement..."
                className="w-full px-3.5 py-2 rounded-2xl bg-neutral-50 border border-neutral-300 text-black text-xs focus:outline-none focus:border-black font-medium"
              />
            </div>

            {/* Bouton Envoi */}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] flex items-center justify-center space-x-2"
            >
              <span>Valider le virement via {getRailName(transferType)}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
