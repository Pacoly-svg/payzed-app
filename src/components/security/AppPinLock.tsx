import React, { useEffect, useRef, useState } from 'react';
import { Delete, Fingerprint } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { haptic } from '../../utils/haptics';
import { BACK_PRIORITY, leaveApp, useBackHandler } from '../../utils/backStack';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const AppPinLock: React.FC = () => {
  const { user, unlockApp, unlockWithBiometrics, isBiometricsEnabled } = useBanking();
  const [digits, setDigits] = useState('');
  const [error, setError] = useState(false);
  const [scanning, setScanning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Retour sur l'écran de verrouillage : l'app passe en arrière-plan (jamais de contournement du code)
  useBackHandler(
    () => {
      void leaveApp();
      return true;
    },
    true,
    BACK_PRIORITY.lock,
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const press = (d: string) => {
    if (digits.length >= 4 || error) return;
    haptic.light();
    const next = digits + d;
    setDigits(next);
    if (next.length === 4) {
      if (unlockApp(next)) {
        haptic.success();
      } else {
        haptic.warning();
        setError(true);
        timer.current = setTimeout(() => {
          setDigits('');
          setError(false);
        }, 700);
      }
    }
  };

  const erase = () => {
    if (error) return;
    haptic.light();
    setDigits((d) => d.slice(0, -1));
  };

  const biometrics = () => {
    if (scanning) return;
    haptic.selection();
    setScanning(true);
    timer.current = setTimeout(() => {
      haptic.success();
      unlockWithBiometrics();
    }, 900);
  };

  const initials = user.name.trim().split(/\s+/).map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase();
  const key = 'w-[72px] h-[72px] rounded-full flex items-center justify-center active:bg-neutral-200 transition-colors';

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col app-safe-top app-safe-bottom select-none">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <span className="w-[72px] h-[72px] rounded-full overflow-hidden bg-black text-white flex items-center justify-center text-2xl font-bold">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
        </span>
        <p className="mt-4 text-xl font-bold">{user.name}</p>
        <p className="mt-1 text-[15px] text-neutral-500">{scanning ? 'Posez votre doigt sur le capteur' : 'Entrez votre code PIN'}</p>

        <div className={`flex gap-5 mt-8 ${error ? 'animate-shake' : ''}`} aria-label={`${digits.length} chiffres saisis sur 4`}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-4 h-4 rounded-full transition-colors ${
                error ? 'bg-red-600' : i < digits.length ? 'bg-black' : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>
        <p className="h-5 mt-4 text-sm font-semibold text-red-600" aria-live="polite">
          {error ? 'Code incorrect' : ''}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-y-4 justify-items-center px-10 pb-8 max-w-sm w-full mx-auto">
        {KEYS.map((d) => (
          <button key={d} type="button" onClick={() => press(d)} className={`${key} bg-neutral-100 text-[28px] font-semibold`}>
            {d}
          </button>
        ))}
        {isBiometricsEnabled ? (
          <button type="button" onClick={biometrics} aria-label="Empreinte digitale" className={key}>
            <Fingerprint className={`w-8 h-8 ${scanning ? 'animate-pulse' : ''}`} />
          </button>
        ) : (
          <span />
        )}
        <button type="button" onClick={() => press('0')} className={`${key} bg-neutral-100 text-[28px] font-semibold`}>
          0
        </button>
        <button type="button" onClick={erase} aria-label="Effacer" className={key}>
          <Delete className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
