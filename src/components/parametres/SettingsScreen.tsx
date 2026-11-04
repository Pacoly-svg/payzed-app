import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, ChevronRight, Lock, RotateCcw, ScanFace, Trash2 } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase() || 'PZ';

/** Redimensionne la photo pour ne pas saturer le stockage du téléphone. */
function resizeImage(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('img'));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('ctx'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const Toggle: React.FC<{ on: boolean; onClick: () => void; label: string }> = ({ on, onClick, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onClick}
    className={`w-12 h-7 rounded-full p-0.5 shrink-0 transition-colors ${on ? 'bg-black' : 'bg-neutral-300'}`}
  >
    <span className={`block w-6 h-6 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
  </button>
);

export const SettingsScreen: React.FC = () => {
  const {
    user,
    updateUser,
    lockApp,
    changePin,
    isBiometricsEnabled,
    toggleBiometrics,
    resetToDemoDefaults,
    showToast,
  } = useBanking();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [newPin, setNewPin] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user.name);
    setPhone(user.phone);
  }, [user.name, user.phone]);

  const dirty = name.trim() !== user.name || phone.trim() !== user.phone;

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return showToast('Le nom est obligatoire');
    updateUser({ name: n, phone: phone.trim() });
    showToast('Profil enregistré');
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast('Choisissez une image');
    try {
      updateUser({ avatarUrl: await resizeImage(file) });
      showToast('Photo mise à jour');
    } catch {
      showToast("Impossible de lire l'image");
    }
  };

  const savePin = (e: React.FormEvent) => {
    e.preventDefault();
    changePin(newPin);
    setNewPin('');
  };

  const input =
    'w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-base text-black font-semibold focus:outline-none focus:border-black';

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Profil</h1>

      {/* Profil */}
      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-16 h-16 rounded-full shrink-0 active:scale-95 transition-transform"
            aria-label="Changer la photo"
          >
            <span className="w-full h-full rounded-full overflow-hidden bg-black text-white flex items-center justify-center font-bold text-lg">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initialsOf(user.name)
              )}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-black text-white border-2 border-white flex items-center justify-center">
              <Camera className="w-3 h-3" />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-base truncate">{user.name}</p>
            <p className="text-sm text-neutral-500 truncate">{user.phone}</p>
          </div>
          {user.avatarUrl && (
            <button
              type="button"
              onClick={() => updateUser({ avatarUrl: '' })}
              className="p-2.5 rounded-full bg-neutral-100 text-neutral-600 active:scale-95"
              aria-label="Supprimer la photo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
        </div>

        <form onSubmit={saveProfile} className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-neutral-500 mb-1 block">Nom complet</span>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-neutral-500 mb-1 block">Téléphone</span>
            <input
              className={input}
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </label>
          {dirty && (
            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-black text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Check className="w-4 h-4" /> Enregistrer
            </button>
          )}
        </form>
      </section>

      {/* Sécurité */}
      <section className="rounded-3xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          <ScanFace className="w-5 h-5 shrink-0" />
          <span className="flex-1 font-semibold text-sm">Déverrouillage biométrique</span>
          <Toggle on={isBiometricsEnabled} onClick={toggleBiometrics} label="Biométrie" />
        </div>

        <form onSubmit={savePin} className="flex items-center gap-3 p-4">
          <Lock className="w-5 h-5 shrink-0" />
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Nouveau code PIN"
            className="flex-1 min-w-0 bg-transparent text-base font-semibold placeholder:text-neutral-400 placeholder:font-medium focus:outline-none"
          />
          <button
            type="submit"
            disabled={newPin.length !== 4}
            className="px-4 py-2 rounded-full text-xs font-bold bg-black text-white disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            OK
          </button>
        </form>

        <button type="button" onClick={lockApp} className="w-full flex items-center gap-3 p-4 text-left active:bg-neutral-50">
          <Lock className="w-5 h-5 shrink-0" />
          <span className="flex-1 font-semibold text-sm">Verrouiller maintenant</span>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>
      </section>

      {/* Réinitialisation */}
      <section className="rounded-3xl border border-neutral-200 p-4">
        {confirmReset ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Tout remettre à zéro ? Profil, solde et historique seront restaurés.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-3 rounded-full bg-neutral-100 font-bold text-sm"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDemoDefaults();
                  setConfirmReset(false);
                }}
                className="flex-1 py-3 rounded-full bg-red-600 text-white font-bold text-sm"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmReset(true)} className="w-full flex items-center gap-3 text-left">
            <RotateCcw className="w-5 h-5 shrink-0 text-red-600" />
            <span className="flex-1 font-semibold text-sm text-red-600">Réinitialiser les données</span>
          </button>
        )}
      </section>

      <p className="text-center text-xs text-neutral-400">Payzed · version {__APP_VERSION__}</p>
    </div>
  );
};
