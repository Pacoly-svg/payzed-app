import React, { useEffect, useRef, useState } from 'react';
import { Camera, ChevronRight, Fingerprint, KeyRound, Lock, Presentation, RotateCcw } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { Sheet } from '../common/Sheet';
import { DemoSheet } from './DemoSheet';
import { Button, Field, IconBox, List, PageTitle, Row, SectionTitle, Toggle } from '../ui';

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

export const SettingsScreen: React.FC = () => {
  const { user, updateUser, lockApp, isBiometricsEnabled, toggleBiometrics, resetToDemoDefaults, showToast } = useBanking();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [sheet, setSheet] = useState<'pin' | 'reset' | 'demo' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Resynchroniser si le profil change ailleurs (réinitialisation)
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
    (document.activeElement as HTMLElement | null)?.blur();
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

  return (
    <div className="space-y-7">
      <PageTitle>Profil</PageTitle>

      {/* Identité */}
      <section className="flex flex-col items-center text-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-24 h-24 rounded-full active:scale-95 transition-transform"
          aria-label="Changer la photo"
        >
          <span className="w-full h-full rounded-full overflow-hidden bg-black text-white flex items-center justify-center font-bold text-3xl">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : initialsOf(user.name)}
          </span>
          <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border-2 border-white shadow flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
        <p className="mt-3 text-xl font-bold">{user.name}</p>
        <p className="text-[15px] text-neutral-500">{user.phone}</p>
        {user.avatarUrl && (
          <button type="button" onClick={() => updateUser({ avatarUrl: '' })} className="mt-1 text-[13px] font-semibold text-neutral-500 py-1">
            Retirer la photo
          </button>
        )}
      </section>

      <form onSubmit={saveProfile} className="space-y-4">
        <SectionTitle>Mes informations</SectionTitle>
        <Field label="Nom complet" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <Field label="Téléphone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        {dirty && (
          <Button type="submit" className="w-full">
            Enregistrer
          </Button>
        )}
      </form>

      {/* Sécurité */}
      <section className="space-y-3">
        <SectionTitle>Sécurité</SectionTitle>
        <List>
          <Row
            icon={<IconBox><Fingerprint className="w-5 h-5" /></IconBox>}
            title="Empreinte digitale"
            subtitle="Déverrouiller sans code"
            trailing={<Toggle on={isBiometricsEnabled} onChange={toggleBiometrics} label="Empreinte digitale" />}
          />
          <Row
            onClick={() => setSheet('pin')}
            icon={<IconBox><KeyRound className="w-5 h-5" /></IconBox>}
            title="Changer le code PIN"
            trailing={<ChevronRight className="w-5 h-5 text-neutral-400" />}
          />
          <Row
            onClick={lockApp}
            icon={<IconBox><Lock className="w-5 h-5" /></IconBox>}
            title="Verrouiller l'application"
            trailing={<ChevronRight className="w-5 h-5 text-neutral-400" />}
          />
        </List>
      </section>

      {/* Données & présentation */}
      <section className="space-y-3">
        <SectionTitle>Présentation & données</SectionTitle>
        <List>
          <Row
            onClick={() => setSheet('demo')}
            icon={<IconBox><Presentation className="w-5 h-5" /></IconBox>}
            title="Simulations"
            subtitle="Entrées, sorties et solde"
            trailing={<ChevronRight className="w-5 h-5 text-neutral-400" />}
          />
          <Row
            onClick={() => setSheet('reset')}
            icon={<IconBox className="text-red-600"><RotateCcw className="w-5 h-5" /></IconBox>}
            title={<span className="text-red-600">Réinitialiser l'application</span>}
            trailing={<ChevronRight className="w-5 h-5 text-neutral-400" />}
          />
        </List>
      </section>

      <p className="text-center text-[13px] text-neutral-400 pb-2">Payzed · version {__APP_VERSION__}</p>

      {sheet === 'pin' && <PinSheet onClose={() => setSheet(null)} />}
      {sheet === 'demo' && <DemoSheet onClose={() => setSheet(null)} />}
      {sheet === 'reset' && (
        <Sheet title="Réinitialiser ?" onClose={() => setSheet(null)}>
          <p className="text-[15px] text-neutral-600">
            Le profil, le solde, l'historique, les coffres et le code PIN reviendront à leur état de départ.
          </p>
          <div className="space-y-2 mt-6">
            <Button
              className="w-full bg-red-600"
              onClick={() => {
                resetToDemoDefaults();
                setSheet(null);
              }}
            >
              Réinitialiser
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setSheet(null)}>
              Annuler
            </Button>
          </div>
        </Sheet>
      )}
    </div>
  );
};

const PinSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { changePin } = useBanking();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length === 4 && pin !== confirm;
  const ready = pin.length === 4 && pin === confirm;
  const clean = (v: string) => v.replace(/\D/g, '').slice(0, 4);

  return (
    <Sheet title="Nouveau code PIN" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!ready) return;
          changePin(pin);
          onClose();
        }}
        className="space-y-4"
      >
        <Field
          label="Nouveau code (4 chiffres)"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(clean(e.target.value))}
          className="tracking-[0.6em] text-center text-xl"
          autoFocus
        />
        <Field
          label="Confirmer le code"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={confirm}
          onChange={(e) => setConfirm(clean(e.target.value))}
          className="tracking-[0.6em] text-center text-xl"
          hint={mismatch ? 'Les deux codes ne correspondent pas' : undefined}
        />
        <Button type="submit" className="w-full" disabled={!ready}>
          Enregistrer
        </Button>
      </form>
    </Sheet>
  );
};
