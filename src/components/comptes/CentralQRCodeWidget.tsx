import React, { useState } from 'react';
import { 
  Scan, 
  Copy, 
  Check, 
  ArrowUpRight, 
  Camera
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';

export const CentralQRCodeWidget: React.FC = () => {
  const { user, setActiveModal, showToast } = useBanking();
  const [activeMode, setActiveMode] = useState<'receive' | 'scan'>('receive');
  const [copied, setCopied] = useState(false);

  const handleCopyTag = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`https://payzed.io/pay/${user.tag.replace('@', '')}`);
    setCopied(true);
    showToast('Lien de paiement copié');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-3xl bg-white border border-neutral-200/90 p-4 shadow-xs transition-all my-3.5">
      {/* Mode Toggle Tabs */}
      <div className="flex items-center justify-center mb-3">
        <div className="inline-flex items-center p-1 rounded-full bg-neutral-100 border border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveMode('receive')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeMode === 'receive'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            Mon QR Code
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('scan')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeMode === 'scan'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            Scanner
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeMode === 'receive' ? (
        <div className="flex flex-col items-center justify-center py-1">
          {/* QR Code Container : Just the clean QR Code */}
          <div 
            onClick={() => setActiveModal('qr')}
            className="relative p-3.5 rounded-2xl bg-white border border-neutral-200 shadow-xs cursor-pointer hover:border-black transition-all group"
            title="Agrandir"
          >
            {/* Corner Markers */}
            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-black pointer-events-none" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-black pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-black pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-black pointer-events-none" />

            {/* Pure QR Code */}
            <div className="w-36 h-36 bg-white p-1 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full text-black fill-current">
                {/* Patterns de localisation */}
                <rect x="5" y="5" width="26" height="26" rx="2" fill="#000000" />
                <rect x="9" y="9" width="18" height="18" rx="1" fill="#FFFFFF" />
                <rect x="13" y="13" width="10" height="10" rx="1" fill="#000000" />

                <rect x="69" y="5" width="26" height="26" rx="2" fill="#000000" />
                <rect x="73" y="9" width="18" height="18" rx="1" fill="#FFFFFF" />
                <rect x="77" y="13" width="10" height="10" rx="1" fill="#000000" />

                <rect x="5" y="69" width="26" height="26" rx="2" fill="#000000" />
                <rect x="9" y="73" width="18" height="18" rx="1" fill="#FFFFFF" />
                <rect x="13" y="77" width="10" height="10" rx="1" fill="#000000" />

                {/* Blocs de données authentiques */}
                <rect x="36" y="8" width="6" height="6" rx="0.5" fill="#000000" />
                <rect x="46" y="8" width="8" height="6" rx="0.5" fill="#000000" />
                <rect x="58" y="8" width="6" height="6" rx="0.5" fill="#000000" />

                <rect x="36" y="18" width="12" height="6" rx="0.5" fill="#000000" />
                <rect x="52" y="18" width="12" height="6" rx="0.5" fill="#000000" />

                <rect x="36" y="28" width="6" height="10" rx="0.5" fill="#000000" />
                <rect x="46" y="28" width="10" height="6" rx="0.5" fill="#000000" />
                <rect x="60" y="28" width="6" height="10" rx="0.5" fill="#000000" />

                <rect x="8" y="36" width="6" height="12" rx="0.5" fill="#000000" />
                <rect x="18" y="36" width="12" height="6" rx="0.5" fill="#000000" />
                <rect x="24" y="46" width="6" height="12" rx="0.5" fill="#000000" />

                <rect x="38" y="38" width="8" height="8" rx="0.5" fill="#000000" />
                <rect x="52" y="38" width="10" height="10" rx="0.5" fill="#000000" />

                <rect x="68" y="36" width="10" height="6" rx="0.5" fill="#000000" />
                <rect x="82" y="36" width="10" height="8" rx="0.5" fill="#000000" />
                <rect x="74" y="46" width="18" height="6" rx="0.5" fill="#000000" />

                <rect x="36" y="68" width="8" height="8" rx="0.5" fill="#000000" />
                <rect x="48" y="68" width="14" height="6" rx="0.5" fill="#000000" />
                <rect x="66" y="68" width="6" height="12" rx="0.5" fill="#000000" />

                <rect x="36" y="80" width="14" height="6" rx="0.5" fill="#000000" />
                <rect x="54" y="80" width="8" height="12" rx="0.5" fill="#000000" />
                <rect x="66" y="84" width="10" height="8" rx="0.5" fill="#000000" />
              </svg>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 mt-3">
            <button
              type="button"
              onClick={handleCopyTag}
              className="py-1.5 px-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-semibold flex items-center space-x-1.5 border border-neutral-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié' : 'Copier le lien'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('qr')}
              className="py-1.5 px-3 rounded-full bg-black text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs hover:bg-neutral-800 transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Agrandir</span>
            </button>
          </div>
        </div>
      ) : (
        /* SCAN MODE */
        <div className="flex flex-col items-center text-center p-2 space-y-3">
          <div className="relative w-full max-w-[220px] aspect-video rounded-2xl bg-black overflow-hidden border border-neutral-800 flex flex-col items-center justify-center shadow-inner">
            <div className="absolute inset-3 border border-dashed border-white/60 rounded-xl pointer-events-none flex items-center justify-center">
              <div className="w-full h-0.5 bg-red-500/80 shadow-md animate-pulse" />
            </div>
            <Camera className="w-7 h-7 text-neutral-400" />
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveModal('transfer');
              showToast('Scanner prêt : Sélectionnez un destinataire');
            }}
            className="py-2 px-5 rounded-full bg-black text-white text-xs font-bold shadow-xs hover:bg-neutral-800 flex items-center space-x-1.5 transition-all active:scale-95"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Scanner pour payer</span>
          </button>
        </div>
      )}
    </div>
  );
};
