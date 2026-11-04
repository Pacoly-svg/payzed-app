import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Users, 
  Repeat, 
  Download, 
  MapPin, 
  Copy, 
  Check, 
  Coffee, 
  ShoppingBag, 
  Tv, 
  Home, 
  TrendingUp, 
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Smartphone,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency, formatTransactionDate } from '../../utils/formatters';

import { BrandLogo } from '../common/BrandLogo';
import { TransactionReceiptModal } from './TransactionReceiptModal';
import { haptic } from '../../utils/haptics';

const ICON_MAP: Record<string, React.ElementType> = {
  Coffee,
  ShoppingBag,
  Tv,
  ArrowDownLeft,
  ArrowUpRight,
  Home,
  TrendingUp,
  CreditCard,
  Smartphone,
};

export const TransactionDetailsModal: React.FC = () => {
  const { selectedTransaction, setSelectedTransaction, currency, showToast, toggleArchiveTransaction } = useBanking();
  const [copied, setCopied] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  if (!selectedTransaction) return null;

  const Icon = ICON_MAP[selectedTransaction.icon] || CreditCard;

  const handleCopyRef = () => {
    haptic.selection();
    navigator.clipboard.writeText(selectedTransaction.reference);
    setCopied(true);
    showToast('Numéro de référence copié');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = (type: 'split' | 'repeat' | 'receipt') => {
    haptic.light();
    if (type === 'split') {
      showToast('Lien de partage sécurisé généré');
    } else if (type === 'repeat') {
      showToast(`Renouvellement de ${formatCurrency(Math.abs(selectedTransaction.amount), currency)} initié`);
    } else {
      setShowReceipt(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white text-black overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-neutral-200">
        
        {/* Barre Supérieure */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-neutral-100">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Détail de l'opération
          </span>

          <button
            onClick={() => setSelectedTransaction(null)}
            className="p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps Déroulant */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          
          {/* Synthèse Principale */}
          <div className="flex flex-col items-center text-center space-y-2 pt-1">
            {selectedTransaction.brandLogo ? (
              <BrandLogo brand={selectedTransaction.brandLogo} size={56} className="rounded-2xl shadow-sm" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black shadow-xs">
                <Icon className="w-7 h-7 stroke-[2]" />
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-black tracking-tight">
                {selectedTransaction.title}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {selectedTransaction.subtitle}
              </p>
            </div>

            {/* Montant Exact en Noir Pur */}
            <div className="text-3xl sm:text-4xl font-black font-sans tracking-tight pt-1 text-black">
              {formatCurrency(selectedTransaction.amount, currency, { showSign: true })}
            </div>

            {/* Statut Monochrome Sobre */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold border border-neutral-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-black" />
              <span>Opération confirmée</span>
            </div>
          </div>

          {/* Bannière si archivée */}
          {selectedTransaction.isArchived && (
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-700">
              <Archive className="w-4 h-4 text-neutral-800 shrink-0" />
              <span>Opération masquée de l'historique principal</span>
            </div>
          )}

          {/* Boutons d'Action Monochrome : Partager, Répéter, Reçu, Archiver */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              onClick={() => handleAction('split')}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-black transition-all active:scale-95 text-[11px] font-semibold"
            >
              <Users className="w-4 h-4 text-neutral-700 mb-1" />
              <span className="truncate">Partager</span>
            </button>

            <button
              onClick={() => handleAction('repeat')}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-black transition-all active:scale-95 text-[11px] font-semibold"
            >
              <Repeat className="w-4 h-4 text-neutral-700 mb-1" />
              <span className="truncate">Répéter</span>
            </button>

            <button
              onClick={() => handleAction('receipt')}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-black transition-all active:scale-95 text-[11px] font-semibold"
            >
              <Download className="w-4 h-4 text-neutral-700 mb-1" />
              <span className="truncate">Reçu PDF</span>
            </button>

            <button
              onClick={() => toggleArchiveTransaction(selectedTransaction.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl border transition-all active:scale-95 text-[11px] font-semibold ${
                selectedTransaction.isArchived 
                  ? 'bg-black text-white border-black shadow-xs' 
                  : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700 hover:text-black'
              }`}
            >
              {selectedTransaction.isArchived ? (
                <>
                  <ArchiveRestore className="w-4 h-4 mb-1 text-white" />
                  <span className="truncate">Restaurer</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 mb-1 text-neutral-700" />
                  <span className="truncate">Archiver</span>
                </>
              )}
            </button>
          </div>

          {/* Tableau Détaillé des Métadonnées */}
          <div className="rounded-2xl bg-neutral-50 border border-neutral-200/90 p-3.5 space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Date & Heure</span>
              <span className="text-black font-semibold font-mono">
                {formatTransactionDate(selectedTransaction.timestamp)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Catégorie</span>
              <span className="text-black font-semibold">
                {selectedTransaction.category}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Moyen de paiement</span>
              <span className="text-black font-semibold">
                {selectedTransaction.paymentMethod}
              </span>
            </div>

            {selectedTransaction.recipientPhone && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Coordonnées (Tél)</span>
                <span className="text-black font-semibold font-mono text-[11px]">
                  {selectedTransaction.recipientPhone}
                </span>
              </div>
            )}

            {selectedTransaction.recipientEmail && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Email</span>
                <span className="text-black font-semibold text-[11px]">
                  {selectedTransaction.recipientEmail}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Frais bancaires</span>
              <span className="text-black font-mono font-semibold">
                {formatCurrency(0, currency)} (Inclus)
              </span>
            </div>

            <div className="pt-2 border-t border-neutral-200 flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Numéro d'opération</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-neutral-800 font-mono font-bold text-[11px]">
                  {selectedTransaction.reference}
                </span>
                <button
                  onClick={handleCopyRef}
                  className="p-1 rounded-md hover:bg-neutral-200 text-neutral-600 hover:text-black transition-colors"
                  title="Copier la référence"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Aperçu Cartographique Monochrome */}
          <div className="rounded-2xl bg-black border border-neutral-800 p-3 text-white space-y-2 shadow-inner">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-1.5 text-neutral-200">
                <MapPin className="w-3.5 h-3.5 text-white" />
                <span className="font-semibold truncate max-w-[200px]">
                  {selectedTransaction.location || 'Localisation'}
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">
                {selectedTransaction.locationCity || 'France'}
              </span>
            </div>

            {/* Tracé Vectoriel de Rue Monochrome */}
            <div className="relative w-full h-24 rounded-xl bg-neutral-900 overflow-hidden border border-neutral-800 flex items-center justify-center">
              <svg viewBox="0 0 300 100" className="w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="30" x2="300" y2="30" stroke="#71717a" strokeWidth="4" />
                <line x1="0" y1="70" x2="300" y2="70" stroke="#71717a" strokeWidth="6" />
                <line x1="60" y1="0" x2="60" y2="100" stroke="#71717a" strokeWidth="4" />
                <line x1="150" y1="0" x2="150" y2="100" stroke="#a1a1aa" strokeWidth="8" />
                <line x1="240" y1="0" x2="240" y2="100" stroke="#71717a" strokeWidth="4" />
                <path d="M 0,90 Q 150,20 300,60" stroke="#52525b" strokeWidth="10" fill="none" />
                
                <rect x="70" y="38" width="70" height="26" rx="2" fill="#3f3f46" opacity="0.6" />
                <rect x="165" y="38" width="65" height="26" rx="2" fill="#3f3f46" opacity="0.6" />
              </svg>

              {/* Repère Cartographique Monochrome Pur */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="relative w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-lg border-2 border-black">
                  <div className="w-2 h-2 rounded-full bg-black" />
                </div>
                <div className="w-0.5 h-2 bg-white" />
              </div>

              {/* Étiquette d'adresse */}
              <div className="absolute bottom-1.5 left-2 right-2 px-2.5 py-1 rounded-lg bg-black/90 border border-neutral-800 flex items-center justify-between text-[10px]">
                <span className="text-neutral-200 truncate">
                  {selectedTransaction.location || 'Terminal certifié'}
                </span>
                <span className="text-neutral-400 font-mono text-[9px] shrink-0">Terminal vérifié</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bouton de Fermeture */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50">
          <button
            onClick={() => setSelectedTransaction(null)}
            className="w-full py-3 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]"
          >
            Fermer
          </button>
        </div>

      </div>

      {/* Modal Reçu PDF Officiel */}
      <TransactionReceiptModal 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
      />
    </div>
  );
};
