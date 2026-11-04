import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Scan, 
  Copy, 
  Check, 
  ShieldCheck, 
  Camera,
  CheckCircle2
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { haptic } from '../../utils/haptics';

export const QRCodeModal: React.FC = () => {
  const { activeModal, setActiveModal, user, currency, addTransaction, showToast } = useBanking();
  const [tab, setTab] = useState<'my_code' | 'scanner'>('my_code');
  const [copied, setCopied] = useState(false);
  
  const [isScanning, setIsScanning] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedTarget, setScannedTarget] = useState<{ name: string; tag: string; defaultAmount: number } | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start real camera when tab is scanner and scanning is active
  useEffect(() => {
    if (activeModal === 'qr' && tab === 'scanner' && isScanning) {
      let isCancelled = false;

      const initCamera = async () => {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: 'environment' } }
            });

            if (isCancelled) {
              stream.getTracks().forEach((t) => t.stop());
              return;
            }

            streamRef.current = stream;
            setHasCameraPermission(true);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } else {
            setHasCameraPermission(false);
          }
        } catch (err) {
          console.warn('Camera access error or denied:', err);
          setHasCameraPermission(false);
        }
      };

      initCamera();

      // Simulated detection after 2.4s of scan
      const timer = setTimeout(() => {
        if (!isCancelled) {
          haptic.success();
          setIsScanning(false);
          stopCamera();
          setScannedTarget({
            name: 'Café de Flore Dakar',
            tag: '@flore.dakar',
            defaultAmount: currency === 'XOF' ? 45000 : 75,
          });
        }
      }, 2600);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [activeModal, tab, isScanning, currency]);

  // Clean up camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (activeModal !== 'qr') return null;

  const handleCopyTag = () => {
    haptic.selection();
    navigator.clipboard.writeText(user.tag);
    setCopied(true);
    showToast('Identifiant copié');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmScannedPayment = () => {
    if (!scannedTarget) return;

    haptic.success();
    addTransaction({
      title: scannedTarget.name,
      subtitle: `Paiement QR Code ${scannedTarget.tag}`,
      category: 'Alimentation',
      type: 'card_payment',
      amount: -scannedTarget.defaultAmount,
      currency,
      status: 'completed',
      icon: 'ShoppingBag',
      recipient: scannedTarget.name,
      fee: 0,
      paymentMethod: 'Paiement QR Payzed Instant',
    });

    setPaymentDone(true);
    triggerSuccessConfetti();
    setTimeout(() => {
      setActiveModal(null);
      setPaymentDone(false);
      setScannedTarget(null);
      setIsScanning(true);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="relative w-full max-w-[480px] rounded-t-[28px] bg-white text-black overflow-y-auto overscroll-contain flex flex-col max-h-[90%] animate-sheet-up app-safe-bottom">
        
        {/* En-tête Monochrome */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black">
              <QrCode className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-black">QR Code Payzed</h2>
              <p className="text-[10px] text-neutral-500 font-medium">Paiement & encaissement sans contact</p>
            </div>
          </div>

          <button
            onClick={() => {
              haptic.light();
              stopCamera();
              setActiveModal(null);
            }}
            className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sélecteur d'onglet Monochrome */}
        <div className="p-3 border-b border-neutral-100">
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-neutral-100 border border-neutral-200">
            <button
              onClick={() => {
                haptic.selection();
                stopCamera();
                setTab('my_code');
                setPaymentDone(false);
              }}
              className={`flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'my_code'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Mon QR Code</span>
            </button>
            <button
              onClick={() => {
                haptic.selection();
                setTab('scanner');
                setIsScanning(true);
                setPaymentDone(false);
                setScannedTarget(null);
              }}
              className={`flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'scanner'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Scanner un code</span>
            </button>
          </div>
        </div>

        {/* Onglet 1 : Mon QR Code */}
        {tab === 'my_code' && (
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="relative p-4 rounded-3xl bg-white border border-neutral-200 shadow-md">
              <svg viewBox="0 0 100 100" className="w-44 h-44 text-black fill-current" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="5" width="26" height="26" rx="3" fill="#000000" />
                <rect x="9" y="9" width="18" height="18" rx="2" fill="#FFFFFF" />
                <rect x="13" y="13" width="10" height="10" rx="1" fill="#000000" />

                <rect x="69" y="5" width="26" height="26" rx="3" fill="#000000" />
                <rect x="73" y="9" width="18" height="18" rx="2" fill="#FFFFFF" />
                <rect x="77" y="13" width="10" height="10" rx="1" fill="#000000" />

                <rect x="5" y="69" width="26" height="26" rx="3" fill="#000000" />
                <rect x="9" y="73" width="18" height="18" rx="2" fill="#FFFFFF" />
                <rect x="13" y="77" width="10" height="10" rx="1" fill="#000000" />

                {/* Pattern Data Bits */}
                <rect x="36" y="8" width="5" height="5" />
                <rect x="46" y="14" width="5" height="5" />
                <rect x="56" y="8" width="5" height="5" />
                <rect x="36" y="24" width="5" height="5" />
                <rect x="54" y="22" width="5" height="5" />

                <rect x="8" y="38" width="5" height="5" />
                <rect x="18" y="46" width="5" height="5" />
                <rect x="26" y="38" width="5" height="5" />

                <rect x="70" y="38" width="5" height="5" />
                <rect x="84" y="44" width="5" height="5" />
                <rect x="76" y="54" width="5" height="5" />

                <rect x="38" y="38" width="24" height="24" rx="4" fill="#000000" />
                <circle cx="50" cy="50" r="7" fill="#FFFFFF" />
                <circle cx="50" cy="50" r="3.5" fill="#000000" />

                <rect x="36" y="70" width="5" height="5" />
                <rect x="48" y="76" width="5" height="5" />
                <rect x="58" y="70" width="5" height="5" />
                <rect x="42" y="86" width="5" height="5" />
                <rect x="54" y="86" width="5" height="5" />

                <rect x="70" y="70" width="5" height="5" />
                <rect x="82" y="76" width="5" height="5" />
                <rect x="76" y="86" width="5" height="5" />
                <rect x="88" y="86" width="5" height="5" />
              </svg>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-black">{user.name}</h3>
              <div className="flex items-center justify-center space-x-1.5">
                <span className="font-mono text-xs text-neutral-500 font-semibold">{user.tag}</span>
                <button
                  onClick={handleCopyTag}
                  className="flex items-center space-x-1 text-[11px] font-semibold text-neutral-700 hover:text-black transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 font-medium flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-black shrink-0" />
              <span>Chiffrement et protection bancaire Payzed</span>
            </div>
          </div>
        )}

        {/* Onglet 2 : Scanner un QR Code avec flux caméra réel */}
        {tab === 'scanner' && (
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            {paymentDone ? (
              <div className="py-8 space-y-3 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mx-auto shadow-xl">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-bold text-black font-sans">Paiement Validé</h3>
                <p className="text-xs text-neutral-500 font-medium">
                  Votre transaction a été exécutée avec succès via QR Payzed.
                </p>
              </div>
            ) : isScanning ? (
              <div className="w-full space-y-4">
                <div className="relative w-full aspect-square max-w-[240px] mx-auto rounded-3xl bg-neutral-950 overflow-hidden border border-neutral-800 flex items-center justify-center shadow-lg">
                  
                  {/* Flux Vidéo Caméra Réelle */}
                  {hasCameraPermission && (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

                  {/* Viseur Coins Blancs */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-sm z-20 pointer-events-none" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-sm z-20 pointer-events-none" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-sm z-20 pointer-events-none" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-sm z-20 pointer-events-none" />

                  {/* Ligne Laser de Balayage Animée */}
                  <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_8px_rgba(255,255,255,0.8)] z-20 animate-pulse pointer-events-none" style={{ animation: 'bounce 2s infinite' }} />

                  {/* Fallback si caméra non disponible */}
                  {!hasCameraPermission && (
                    <div className="text-center space-y-2 opacity-80 z-10 px-4">
                      <Camera className="w-8 h-8 mx-auto text-neutral-400 animate-pulse" />
                      <p className="text-[10px] text-neutral-300 font-medium">Placez le QR code dans le cadre</p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-neutral-600 font-medium flex items-center justify-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                  <span>Recherche d'un terminal ou d'un QR marchand...</span>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-4 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Marchand Détecté
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 font-bold">{scannedTarget?.tag}</span>
                  </div>
                  <h4 className="text-sm font-bold text-black">{scannedTarget?.name}</h4>
                  <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                    <span className="text-xs text-neutral-500 font-medium">Montant à régler :</span>
                    <span className="text-base font-extrabold text-black font-sans">
                      {formatCurrency(scannedTarget?.defaultAmount || 0, currency)}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      haptic.light();
                      setIsScanning(true);
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold border border-neutral-200 transition-all active:scale-95"
                  >
                    Réessayer
                  </button>
                  <button
                    onClick={handleConfirmScannedPayment}
                    className="flex-1 py-2.5 rounded-2xl bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                  >
                    Confirmer le Paiement
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
