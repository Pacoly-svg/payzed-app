import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Delete, 
  Fingerprint, 
  Lock, 
  ScanFace,
  CheckCircle2
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { haptic } from '../../utils/haptics';

interface AppPinLockProps {
  onUnlock?: () => void;
}

export const AppPinLock: React.FC<AppPinLockProps> = ({ onUnlock }) => {
  const { user, unlockApp, unlockWithBiometrics, isBiometricsEnabled } = useBanking();
  const [pinDigits, setPinDigits] = useState<string[]>([]);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // State pour simulation Face ID / Biométrie
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  // Auto-verify PIN when 4 digits are entered
  useEffect(() => {
    if (pinDigits.length === 4) {
      const entered = pinDigits.join('');
      const success = unlockApp(entered);
      if (success) {
        haptic.success();
        setHasError(false);
        setErrorMessage('');
        onUnlock?.();
      } else {
        haptic.warning();
        setHasError(true);
        setErrorMessage('Code PIN incorrect');
        setTimeout(() => {
          setPinDigits([]);
          setHasError(false);
        }, 800);
      }
    }
  }, [pinDigits, unlockApp, onUnlock]);

  const handleKeyPress = (num: string) => {
    if (pinDigits.length < 4) {
      haptic.light();
      setPinDigits((prev) => [...prev, num]);
      setHasError(false);
      setErrorMessage('');
    }
  };

  const handleDelete = () => {
    haptic.light();
    setPinDigits((prev) => prev.slice(0, -1));
    setHasError(false);
    setErrorMessage('');
  };

  const triggerBiometrics = () => {
    if (isBiometricScanning || biometricSuccess) return;
    haptic.selection();
    setIsBiometricScanning(true);
    setErrorMessage('');

    setTimeout(() => {
      haptic.success();
      setBiometricSuccess(true);
      setTimeout(() => {
        setIsBiometricScanning(false);
        setBiometricSuccess(false);
        unlockWithBiometrics();
        onUnlock?.();
      }, 700);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between p-6 sm:p-8 select-none">
      
      {/* Simulation Modal Face ID Apple / Touch ID */}
      {isBiometricScanning && (
        <div className="absolute inset-0 z-60 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-[280px] bg-white rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl border border-neutral-200">
            <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
              {biometricSuccess ? (
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-in zoom-in duration-200 shadow-lg">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>
              ) : (
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl border-2 border-black flex items-center justify-center animate-pulse">
                    <ScanFace className="w-9 h-9 text-black" />
                  </div>
                  <div className="absolute -inset-2 border-2 border-dashed border-neutral-300 rounded-3xl animate-spin duration-1000" />
                </div>
              )}
            </div>

            <h3 className="text-base font-bold text-black font-sans">
              {biometricSuccess ? 'Identité confirmée' : 'Reconnaissance Face ID'}
            </h3>
            <p className="text-xs text-neutral-500 mt-1 font-medium">
              {biometricSuccess ? `${user.name}` : 'Regardez l\'écran pour déverrouiller...'}
            </p>
          </div>
        </div>
      )}

      {/* En-tête / Profil Utilisateur */}
      <div className="flex flex-col items-center pt-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-800 mb-5">
          <ShieldCheck className="w-3.5 h-3.5 text-black" />
          <span>Payzed Sécurité Certifiée</span>
        </div>

        {/* Monogramme / Photo Utilisateur Dynamique */}
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-black text-white flex items-center justify-center font-extrabold text-2xl font-mono border-2 border-black shadow-sm">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black rounded-full flex items-center justify-center text-white border-2 border-white shadow-xs">
            <Lock className="w-3 h-3" />
          </div>
        </div>

        <h2 className="text-xl font-black text-black tracking-tight">{user.name}</h2>
        <p className="text-xs text-neutral-500 mt-0.5 font-medium">{user.tag}</p>

        {/* Bouton Rapide Déverrouillage Face ID / Empreinte si activé */}
        {isBiometricsEnabled && (
          <button
            type="button"
            onClick={triggerBiometrics}
            className="mt-3.5 inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/90 text-xs font-bold text-black shadow-2xs active:scale-95 transition-all"
          >
            <ScanFace className="w-4 h-4 text-black" />
            <span>Déverrouiller avec Face ID</span>
          </button>
        )}
      </div>

      {/* Points indicateurs du code PIN */}
      <div className="flex flex-col items-center my-3">
        <div className={`flex items-center gap-4 transition-transform ${hasError ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pinDigits.length > index;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  hasError
                    ? 'bg-red-500 scale-110'
                    : isFilled
                    ? 'bg-black scale-110'
                    : 'border-2 border-neutral-300 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {errorMessage ? (
          <p className="text-xs font-semibold text-red-600 mt-3 tracking-tight animate-fadeIn">
            {errorMessage}
          </p>
        ) : (
          <p className="text-[11px] text-neutral-400 font-mono mt-3 font-medium">
            Code par défaut : <span className="font-bold text-neutral-700">1234</span>
          </p>
        )}
      </div>

      {/* Clavier Tactile (3x4) */}
      <div className="w-full max-w-xs mx-auto pb-4">
        <div className="grid grid-cols-3 gap-y-3.5 gap-x-6 justify-items-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="w-16 h-16 rounded-full bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 text-black text-2xl font-semibold flex items-center justify-center transition-all border border-neutral-200/80 shadow-2xs focus:outline-none"
            >
              {digit}
            </button>
          ))}

          {/* Bouton Biométrie (Face ID / Empreinte) */}
          <button
            type="button"
            onClick={triggerBiometrics}
            title="Face ID & Empreinte digitale"
            className="w-16 h-16 rounded-full bg-neutral-100 hover:bg-neutral-200 text-black flex flex-col items-center justify-center transition-all border border-neutral-200 focus:outline-none active:scale-95 shadow-2xs"
          >
            <Fingerprint className="w-6 h-6 text-black" />
            <span className="text-[8px] font-bold text-neutral-700 mt-0.5">Biométrie</span>
          </button>

          {/* Chiffre 0 */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 text-black text-2xl font-semibold flex items-center justify-center transition-all border border-neutral-200/80 shadow-2xs focus:outline-none"
          >
            0
          </button>

          {/* Bouton Effacer */}
          <button
            type="button"
            onClick={handleDelete}
            title="Effacer"
            className="w-16 h-16 rounded-full bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 text-black flex items-center justify-center transition-all border border-neutral-200/80 focus:outline-none"
          >
            <Delete className="w-5 h-5 text-neutral-700" />
          </button>
        </div>
      </div>

    </div>
  );
};
