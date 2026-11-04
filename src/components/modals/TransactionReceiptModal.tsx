import React, { useState, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Check, 
  Copy, 
  Printer, 
  QrCode,
  FileCheck
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency, formatTransactionDate } from '../../utils/formatters';
import { haptic } from '../../utils/haptics';

interface TransactionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({ isOpen, onClose }) => {
  const { selectedTransaction, currency, showToast } = useBanking();
  const [copied, setCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !selectedTransaction) return null;

  const handleCopyRef = () => {
    haptic.selection();
    navigator.clipboard.writeText(selectedTransaction.reference);
    setCopied(true);
    showToast('Numéro de référence copié');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintOrDownload = () => {
    haptic.success();
    showToast('Génération du reçu officiel PDF...');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-neutral-200 overflow-hidden shadow-2xl flex flex-col text-black max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 shrink-0">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-black stroke-[2.2]" />
            <span className="text-xs font-bold text-black uppercase tracking-wider">
              Reçu de Paiement Certifié
            </span>
          </div>

          <button
            onClick={() => {
              haptic.light();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div ref={receiptRef} className="p-5 overflow-y-auto space-y-4 print:p-8">
          
          {/* Top Brand Watermark & Status */}
          <div className="text-center space-y-2 flex flex-col items-center pt-1">
            <img 
              src="/assets/logo/logo-principal.svg" 
              alt="Payzed" 
              className="h-6 w-auto object-contain mx-auto mb-1"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = '/assets/logo/symbole-noir.svg';
              }}
            />

            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block font-mono">
              Bordereau officiel d'opération
            </span>

            {/* Montant Net Certifié */}
            <div className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-black pt-1">
              {formatCurrency(selectedTransaction.amount, currency, { showSign: true })}
            </div>

            {/* Badge Certifié */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/90 text-neutral-900 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-black" />
              <span>Opération Exécutée & Irrévocable</span>
            </div>
          </div>

          {/* Grille des caractéristiques certifiées */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Bénéficiaire / Émetteur</span>
              <span className="text-black font-bold truncate max-w-[170px] text-right">
                {selectedTransaction.title}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Libellé / Motif</span>
              <span className="text-neutral-700 truncate max-w-[170px] text-right font-medium">
                {selectedTransaction.subtitle}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Catégorie</span>
              <span className="text-neutral-900 font-semibold">
                {selectedTransaction.category}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Date d'exécution</span>
              <span className="text-neutral-800 font-medium font-mono text-[11px]">
                {formatTransactionDate(selectedTransaction.timestamp)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Canal de règlement</span>
              <span className="text-black font-bold">
                {selectedTransaction.paymentMethod}
              </span>
            </div>

            {selectedTransaction.recipientPhone && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Numéro associé</span>
                <span className="text-black font-mono font-semibold text-[11px]">
                  {selectedTransaction.recipientPhone}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Frais de transfert</span>
              <span className="text-neutral-900 font-bold">
                0 {currency} (0% Inclus)
              </span>
            </div>

            <div className="pt-2 border-t border-neutral-200 flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Référence d'archivage</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-black font-mono font-bold text-[11px]">
                  {selectedTransaction.reference}
                </span>
                <button
                  onClick={handleCopyRef}
                  className="p-1 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-800 transition-colors"
                  title="Copier la référence"
                >
                  {copied ? <Check className="w-3 h-3 text-black" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Sceau officiel & QR Code de contrôle */}
          <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/90 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center shrink-0 p-2 shadow-xs">
                <QrCode className="w-full h-full" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-black uppercase tracking-wider">
                  Contrôle d'authenticité
                </p>
                <p className="text-[10px] text-neutral-500 font-medium leading-tight mt-0.5">
                  Signé cryptographiquement par le protocole Payzed UEMOA
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1 print:hidden">
            <button
              onClick={handlePrintOrDownload}
              className="py-3 px-3 rounded-2xl bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4 stroke-[2.2]" />
              <span className="truncate">Télécharger PDF</span>
            </button>

            <button
              onClick={handlePrintOrDownload}
              className="py-3 px-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-900 font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 stroke-[2]" />
              <span className="truncate">Imprimer reçu</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
