import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCcw, 
  User, 
  ArrowDownLeft, 
  ArrowUpRight,
  Lock,
  Clock,
  Bell,
  ShieldCheck,
  Wallet,
  ScanFace,
  Phone,
  Check,
  Camera,
  Trash2,
  Volume2,
  VolumeX,
  Calendar,
  Mail,
  Plus,
  X,
  Upload
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { BrandLogo } from '../common/BrandLogo';
import { VerifiedBadge } from '../common/VerifiedBadge';

export const SettingsScreen: React.FC = () => {
  const { 
    balance, 
    setBalance, 
    currency, 
    user, 
    updateUser, 
    updateCard,
    resetToDemoDefaults,
    lockApp,
    changePin,
    isBiometricsEnabled,
    toggleBiometrics,
    isNotifSoundEnabled,
    toggleNotifSound,
    playNotificationSound,
    requestNotificationPermission,
    scheduleSimulation,
    scheduledCountdown,
    customPlatforms,
    addCustomPlatform,
    removeCustomPlatform,
    showToast
  } = useBanking();

  // Profile Form State
  const [customName, setCustomName] = useState(user.name);
  const [customTag, setCustomTag] = useState(user.tag);
  const [customPhone, setCustomPhone] = useState(user.phone || '+221 77 482 19 02');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Custom Platform state
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelLogoUrl, setNewChannelLogoUrl] = useState('');
  const channelFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustomName(user.name);
    setCustomTag(user.tag);
    if (user.phone) setCustomPhone(user.phone);
  }, [user]);

  // Balance Form State
  const [customBalanceInput, setCustomBalanceInput] = useState(balance.toString());

  useEffect(() => {
    setCustomBalanceInput(balance.toString());
  }, [balance]);

  // Simulation Form State
  const [simType, setSimType] = useState<'in' | 'out'>('in');
  const [simPlatform, setSimPlatform] = useState<string>('Wave');
  const [simPerson, setSimPerson] = useState('Babacar Sy');
  const [simRecipientPhone, setSimRecipientPhone] = useState('+221 77 482 19 02');
  const [simRecipientEmail, setSimRecipientEmail] = useState('');
  const [simAmount, setSimAmount] = useState('150000');
  const [simDelay, setSimDelay] = useState<number>(5);
  const [simDelayUnit, setSimDelayUnit] = useState<'secondes' | 'minutes' | 'heures'>('secondes');
  const [simDateType, setSimDateType] = useState<'now' | 'yesterday' | '3days' | 'last_month' | 'custom'>('now');
  const [customDateInput, setCustomDateInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');

  const platforms = [
    { name: 'Wave', logo: 'wave' },
    { name: 'Orange Money', logo: 'orange' },
    { name: 'PayPal', logo: 'paypal' },
    { name: 'Société Générale', logo: 'sgbs' },
    { name: 'Ecobank', logo: 'ecobank' },
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Veuillez sélectionner un format image valide (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Taille d\'image maximale : 5 Mo');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateUser({ avatarUrl: dataUrl });
      showToast('Photo de profil mise à jour');
      triggerSuccessConfetti();
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    updateUser({ avatarUrl: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Photo supprimée (Monogramme par défaut activé)');
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    
    // Normalisation du tag (@...)
    let formattedTag = customTag.trim();
    if (!formattedTag.startsWith('@')) {
      formattedTag = '@' + formattedTag;
    }

    updateUser({ 
      name: customName.trim(),
      tag: formattedTag,
      phone: customPhone.trim()
    });
    updateCard({ cardholderName: customName.trim().toUpperCase() });
    triggerSuccessConfetti();
    showToast('Profil et nom d\'utilisateur mis à jour');
  };

  const handleChannelLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      showToast('Image trop lourde (Max 4 Mo)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNewChannelLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCustomChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) {
      showToast('Nom du canal requis');
      return;
    }
    const logoToUse = newChannelLogoUrl.trim() || '/assets/logo/symbole-noir.svg';
    addCustomPlatform({
      name: newChannelName.trim(),
      logoUrl: logoToUse,
    });
    setSimPlatform(newChannelName.trim());
    triggerSuccessConfetti();
    setIsAddingChannel(false);
    setNewChannelName('');
    setNewChannelLogoUrl('');
  };

  const handleUpdateBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(customBalanceInput.replace(/\s+/g, ''));
    if (!isNaN(parsed) && parsed >= 0) {
      setBalance(parsed);
      triggerSuccessConfetti();
      showToast('Solde mis à jour');
    }
  };

  const handlePresetBalance = (amt: number) => {
    setBalance(amt);
    setCustomBalanceInput(amt.toString());
    triggerSuccessConfetti();
    showToast(`Solde fixé à ${amt.toLocaleString()} ${currency}`);
  };

  const handleStartSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(simAmount.replace(/\s+/g, ''));
    if (isNaN(parsed) || parsed <= 0) {
      showToast('Montant invalide');
      return;
    }

    const numericDelay = Math.max(0, Number(simDelay) || 0);
    let totalSeconds = numericDelay;
    if (simDelayUnit === 'minutes') totalSeconds = numericDelay * 60;
    if (simDelayUnit === 'heures') totalSeconds = numericDelay * 3600;

    let customTimestamp = Date.now();
    let customDateStr = "À l'instant";

    if (simDateType === 'yesterday') {
      customTimestamp = Date.now() - 86400000;
      customDateStr = 'Hier';
    } else if (simDateType === '3days') {
      customTimestamp = Date.now() - 3 * 86400000;
      customDateStr = 'Il y a 3 jours';
    } else if (simDateType === 'last_month') {
      customTimestamp = Date.now() - 30 * 86400000;
      customDateStr = 'Le mois dernier';
    } else if (simDateType === 'custom' && customDateInput) {
      const parsedD = new Date(customDateInput);
      if (!isNaN(parsedD.getTime())) {
        customTimestamp = parsedD.getTime();
        customDateStr = parsedD.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }

    scheduleSimulation({
      type: simType,
      platform: simPlatform,
      personName: simPerson,
      amount: parsed,
      delaySeconds: totalSeconds,
      recipientPhone: simRecipientPhone.trim() || undefined,
      recipientEmail: simRecipientEmail.trim() || undefined,
      customTimestamp,
      customDate: customDateStr,
    });
    if (totalSeconds > 0) {
      showToast(`Simulation planifiée (${simDateType === 'now' ? 'Date actuelle' : customDateStr}) dans ${numericDelay} ${simDelayUnit}`);
    }
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length === 4) {
      changePin(newPinInput);
      setNewPinInput('');
    }
  };

  // Monogram initials preview
  const previewInitials = customName.trim()
    ? customName.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PZ';

  return (
    <div className="space-y-4 pb-24 bg-white text-black">
      
      {/* 1. En-tête sobre et épuré (Harmonisé avec Cartes et Statistiques) */}
      <div className="px-1 pt-1">
        <h1 className="text-xl font-extrabold text-black tracking-tight">
          Paramètres & Profil
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5 font-medium">
          Identité, sécurité Face ID/PIN et gestion du compte
        </p>
      </div>

      {/* 2. Profil & Identité du Titulaire (Nom, Username @tag, Téléphone, Photo) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 text-black flex items-center justify-center shrink-0">
              <User className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-black uppercase tracking-wider">
                Identité & Profil Titulaire
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium">Photo, informations affichées et coordonnées</p>
            </div>
          </div>

          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200 font-bold shrink-0">
            Titulaire
          </span>
        </div>

        {/* Bloc Photo de Profil */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Avatar interactif avec déclencheur de photo au clic */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-12 h-12 rounded-full cursor-pointer group shrink-0"
              title="Cliquer pour choisir une photo"
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-black text-white flex items-center justify-center font-extrabold text-sm font-mono border-2 border-neutral-300 shadow-xs group-hover:opacity-90 transition-opacity">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{previewInitials}</span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-black text-white border-2 border-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Camera className="w-2.5 h-2.5 stroke-[2.5]" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <h3 className="text-xs font-bold text-black truncate">{user.name}</h3>
                <VerifiedBadge size={13} className="text-black shrink-0" />
              </div>
              <p className="text-[10px] text-neutral-500 font-medium truncate mt-0.5">
                {user.tag} • {user.avatarUrl ? 'Photo personnalisée' : 'Monogramme'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-all active:scale-95 shrink-0 whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{user.avatarUrl ? 'Changer' : 'Ajouter une photo'}</span>
            </button>

            {user.avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="p-1.5 rounded-xl bg-neutral-200/80 hover:bg-neutral-300 text-neutral-700 hover:text-black border border-neutral-300 transition-all active:scale-95 shrink-0"
                title="Supprimer la photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-3 pt-1">
          {/* Nom Complet */}
          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Nom et prénom
            </label>
            <div className="relative">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="min-w-0 w-full pl-3.5 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-black text-base sm:text-xs focus:outline-none focus:border-black font-semibold"
                placeholder="Ex: Coly Sène"
                required
              />
            </div>
          </div>

          {/* Nom d'utilisateur (@tag) */}
          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Nom d'utilisateur (Tag de virement)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-neutral-400 text-sm font-mono font-bold select-none">
                @
              </span>
              <input
                type="text"
                value={customTag.replace(/^@/, '')}
                onChange={(e) => setCustomTag('@' + e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                className="min-w-0 w-full pl-7 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-black text-base sm:text-xs font-mono focus:outline-none focus:border-black font-semibold"
                placeholder="coly.sene"
                required
              />
            </div>
          </div>

          {/* Numéro de téléphone */}
          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Numéro de téléphone
            </label>
            <div className="relative flex items-center">
              <Phone className="w-4 h-4 text-neutral-400 absolute left-3" />
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="min-w-0 w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-black text-base sm:text-xs font-mono focus:outline-none focus:border-black font-semibold"
                placeholder="+221 77 482 19 02"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-xs transition-all active:scale-[0.99] flex items-center justify-center space-x-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Enregistrer les modifications de profil</span>
          </button>
        </form>
      </div>

      {/* 3. Sécurité & Authentification (Face ID, Empreinte & Code PIN) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 text-black flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-black uppercase tracking-wider">
                Sécurité & Déverrouillage
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium">Face ID, Empreinte & Code confidentiel</p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center space-x-1 shrink-0">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Protégé</span>
          </span>
        </div>

        {/* Option Biométrique : Face ID & Empreinte Toggle */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-black shrink-0">
              <ScanFace className="w-5 h-5 text-black" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-black leading-tight">
                Face ID & Empreinte digitale
              </p>
              <p className="text-[10px] text-neutral-500 font-medium">
                Déverrouillage instantané sans saisir de code
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleBiometrics}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 focus:outline-none ${
              isBiometricsEnabled ? 'bg-black' : 'bg-neutral-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                isBiometricsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Bouton Tester le Verrouillage */}
        <button
          type="button"
          onClick={lockApp}
          className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-95 border border-neutral-200 shadow-2xs"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Verrouiller pour tester (Face ID & Code PIN)</span>
        </button>

        {/* Formulaire Modification Code PIN */}
        <form onSubmit={handleSavePin} className="pt-2 border-t border-neutral-100 space-y-1.5">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Modifier le code PIN (4 chiffres)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="min-w-0 flex-1 w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-300 text-black text-center tracking-[0.5em] font-mono text-base sm:text-sm focus:outline-none focus:border-black font-bold"
            />
            <button
              type="submit"
              disabled={newPinInput.length !== 4}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                newPinInput.length === 4
                  ? 'bg-black text-white hover:bg-neutral-800 active:scale-95 shadow-xs'
                  : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
              }`}
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      {/* 3.1. Préférences Audio & Notifications Système */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 text-black flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-black uppercase tracking-wider">
                Notifications & Alertes Sonores
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium">Alertes en temps réel et carillon bancaire</p>
            </div>
          </div>
        </div>

        {/* Autorisation Push Système sur Mobile */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-black" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-black truncate">Notifications Système (Mobile)</p>
              <p className="text-[10px] text-neutral-500 font-medium truncate">Barre d'état & écran verrouillé</p>
            </div>
          </div>

          <button
            type="button"
            onClick={requestNotificationPermission}
            className="px-3 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-[11px] font-bold active:scale-95 transition-all shrink-0"
          >
            Activer
          </button>
        </div>

        {/* Son des notifications */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0">
              {isNotifSoundEnabled ? (
                <Volume2 className="w-4 h-4 text-black" />
              ) : (
                <VolumeX className="w-4 h-4 text-neutral-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-black">Son des notifications (Chime)</p>
              <p className="text-[10px] text-neutral-500 font-medium">Carillon discret lors des virements et flux</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={playNotificationSound}
              className="px-2.5 py-1 rounded-lg bg-neutral-200/80 hover:bg-neutral-300 text-black text-[10px] font-bold"
            >
              Tester
            </button>

            <button
              type="button"
              onClick={toggleNotifSound}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 focus:outline-none ${
                isNotifSoundEnabled ? 'bg-black' : 'bg-neutral-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  isNotifSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Solde Principal du Compte */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black shrink-0">
              <Wallet className="w-4 h-4 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-black uppercase tracking-wider">
                Solde du Compte
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium truncate">
                Montant disponible affiché
              </p>
            </div>
          </div>

          <span className="text-sm sm:text-base font-mono font-extrabold text-black shrink-0">
            {formatCurrency(balance, currency)}
          </span>
        </div>

        {/* Pilules de montants rapides (1 seule ligne avec libellés compacts) */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          {currency === 'XOF' ? (
            <>
              <button 
                type="button"
                onClick={() => handlePresetBalance(1500000)} 
                className="py-1.5 px-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-[11px] font-mono font-bold text-black border border-neutral-200 text-center transition-all active:scale-95"
              >
                1,5M F
              </button>
              <button 
                type="button"
                onClick={() => handlePresetBalance(3250000)} 
                className="py-1.5 px-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-[11px] font-mono font-bold text-black border border-neutral-200 text-center transition-all active:scale-95"
              >
                3,25M F
              </button>
              <button 
                type="button"
                onClick={() => handlePresetBalance(10000000)} 
                className="py-1.5 px-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-[11px] font-mono font-bold text-black border border-neutral-200 text-center transition-all active:scale-95"
              >
                10M F
              </button>
            </>
          ) : (
            <>
              <button 
                type="button"
                onClick={() => handlePresetBalance(2500)} 
                className="py-1.5 px-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-[11px] font-mono font-bold text-black border border-neutral-200 text-center transition-all active:scale-95"
              >
                2 500 €
              </button>
              <button 
                type="button"
                onClick={() => handlePresetBalance(5000)} 
                className="py-1.5 px-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-[11px] font-mono font-bold text-black border border-neutral-200 text-center transition-all active:scale-95"
              >
                5 000 €
              </button>
              <button 
                type="button"
                onClick={() => handlePresetBalance(15000)} 
                className="py-1.5 px-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-[11px] font-mono font-bold text-black border border-neutral-200 text-center transition-all active:scale-95"
              >
                15 000 €
              </button>
            </>
          )}
        </div>

        {/* Formulaire de saisie direct */}
        <form onSubmit={handleUpdateBalance} className="flex items-center gap-2 pt-0.5">
          <input
            type="number"
            value={customBalanceInput}
            onChange={(e) => setCustomBalanceInput(e.target.value)}
            className="min-w-0 flex-1 w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-black font-mono text-base sm:text-xs focus:outline-none focus:border-black font-bold"
            placeholder="Saisir montant..."
          />
          <button
            type="submit"
            className="shrink-0 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
          >
            Appliquer
          </button>
        </form>
      </div>

      {/* 5. Simulateur de Flux & Notifications Directes */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-black uppercase tracking-wider">
                Simulateur de Flux & Notifs
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium">Déclenche un flux avec notification native</p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-900 border border-neutral-300 font-bold shrink-0">
            Démo
          </span>
        </div>

        {/* Compte à rebours actif */}
        {scheduledCountdown !== null && (
          <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-300 flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-black" />
              <span className="text-xs font-bold text-black">
                Notification dans {scheduledCountdown}s...
              </span>
            </div>
            <span className="text-xs font-mono font-extrabold text-black">
              {simAmount} {currency}
            </span>
          </div>
        )}

        <form onSubmit={handleStartSimulation} className="space-y-3">
          {/* Bascule Envoi / Réception */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
            <button
              type="button"
              onClick={() => {
                setSimType('in');
                setSimPerson('Babacar Sy');
              }}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                simType === 'in'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2]" />
              <span>Recevoir (+)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSimType('out');
                setSimPerson('Fatou Sow');
              }}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                simType === 'out'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
              <span>Envoyer (-)</span>
            </button>
          </div>

          {/* Choix de la Plateforme & Canaux Personnalisés */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Canal de transfert
              </label>
              <button
                type="button"
                onClick={() => setIsAddingChannel(!isAddingChannel)}
                className="text-[11px] font-bold text-black hover:text-neutral-600 flex items-center space-x-1 py-0.5 px-2 rounded-lg bg-neutral-100 border border-neutral-200 transition-all active:scale-95"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Ajouter un canal</span>
              </button>
            </div>

            {/* Formulaire Modal / Carte pour Ajouter un Nouveau Canal */}
            {isAddingChannel && (
              <div className="mb-3 p-3.5 rounded-2xl bg-neutral-100 border border-neutral-300 space-y-3 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                    Nouveau canal de transfert
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingChannel(false)}
                    className="p-1 rounded-lg text-neutral-500 hover:text-black"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Nom du service / canal
                  </label>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="Ex: Wari, Moov Money, Revolut, Kpay..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-300 text-base sm:text-xs font-semibold text-black focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Logo (Image PNG/SVG ou URL)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={channelFileRef}
                      onChange={handleChannelLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => channelFileRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 text-xs font-bold flex items-center space-x-1.5 transition-all shrink-0 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{newChannelLogoUrl ? 'Changer' : 'Fichier logo'}</span>
                    </button>

                    <input
                      type="text"
                      value={newChannelLogoUrl}
                      onChange={(e) => setNewChannelLogoUrl(e.target.value)}
                      placeholder="Ou coller un lien https://..."
                      className="min-w-0 flex-1 px-3 py-2 rounded-xl bg-white border border-neutral-300 text-base sm:text-xs text-black focus:outline-none focus:border-black font-semibold truncate"
                    />

                    {newChannelLogoUrl && (
                      <div className="w-8 h-8 rounded-xl border border-neutral-200 bg-white p-0.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                        <img src={newChannelLogoUrl} alt="Aperçu" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCustomChannel}
                  disabled={!newChannelName.trim()}
                  className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-40 active:scale-95"
                >
                  Enregistrer et utiliser ce canal
                </button>
              </div>
            )}

            {/* Grille des Plateformes (Officielles + Personnalisées) */}
            <div className="grid grid-cols-2 gap-2">
              {[
                ...platforms.map(p => ({ id: p.name, name: p.name, logo: p.logo, isCustom: false })),
                ...customPlatforms.map(cp => ({ id: cp.id, name: cp.name, logo: cp.logoUrl, isCustom: true }))
              ].map((p) => {
                const isSelected = simPlatform === p.name;
                return (
                  <div
                    key={p.id}
                    className={`relative p-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between text-left group cursor-pointer ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-800'
                    }`}
                    onClick={() => setSimPlatform(p.name)}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <BrandLogo brand={p.logo} size={32} className="w-8 h-8 rounded-xl shrink-0" />
                      <span className="truncate flex-1 text-xs font-bold leading-tight">{p.name}</span>
                    </div>

                    {p.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomPlatform(p.id);
                        }}
                        className={`p-1 rounded-lg transition-colors ml-1 ${
                          isSelected ? 'text-neutral-400 hover:text-white' : 'text-neutral-400 hover:text-red-600'
                        }`}
                        title="Supprimer ce canal personnalisé"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nom du contact & Montant */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                {simType === 'in' ? 'Expéditeur' : 'Bénéficiaire'}
              </label>
              <input
                type="text"
                value={simPerson}
                onChange={(e) => setSimPerson(e.target.value)}
                className="min-w-0 w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-black text-base sm:text-xs focus:outline-none focus:border-black font-semibold h-11"
                placeholder={simType === 'in' ? 'Ex: Babacar Sy' : 'Ex: Fatou Sow'}
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Montant ({currency})
              </label>
              <input
                type="number"
                value={simAmount}
                onChange={(e) => setSimAmount(e.target.value)}
                className="min-w-0 w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-black font-mono text-base sm:text-xs focus:outline-none focus:border-black font-bold h-11"
                placeholder="150000"
                required
              />
            </div>
          </div>

          {/* Numéro de téléphone (Pleine largeur pour zéro coupure) */}
          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Numéro de téléphone
            </label>
            <div className="relative flex items-center">
              <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5" />
              <input
                type="tel"
                value={simRecipientPhone}
                onChange={(e) => setSimRecipientPhone(e.target.value)}
                className="min-w-0 w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-black text-base sm:text-xs font-mono focus:outline-none focus:border-black font-semibold h-11"
                placeholder="+221 77 482 19 02"
                required
              />
            </div>
          </div>

          {/* Email (Optionnel - Pleine largeur pour zéro coupure) */}
          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Email (Optionnel)
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5" />
              <input
                type="email"
                value={simRecipientEmail}
                onChange={(e) => setSimRecipientEmail(e.target.value)}
                className="min-w-0 w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-black text-base sm:text-xs focus:outline-none focus:border-black font-semibold h-11"
                placeholder="contact@exemple.sn"
              />
            </div>
          </div>

          {/* Délai d'envoi Personnalisé (Secondes, Minutes, Heures) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Délai d'envoi & programmation
              </label>
              <span className="text-[11px] font-mono font-bold text-black">
                {simDelay} {simDelayUnit}
              </span>
            </div>

            {/* Raccourcis Rapides */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Direct', val: 0, unit: 'secondes' as const },
                { label: '5 sec', val: 5, unit: 'secondes' as const },
                { label: '30 sec', val: 30, unit: 'secondes' as const },
                { label: '1 min', val: 1, unit: 'minutes' as const },
              ].map((d) => {
                const isActive = simDelay === d.val && simDelayUnit === d.unit;
                return (
                  <button
                    key={`${d.val}-${d.unit}`}
                    type="button"
                    onClick={() => {
                      setSimDelay(d.val);
                      setSimDelayUnit(d.unit);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all text-center ${
                      isActive
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            {/* Saisie Libre Personnalisée : Nombre + Unité (Secondes, Minutes, Heures) */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1 min-w-0">
                <input
                  type="number"
                  min="0"
                  value={simDelay}
                  onChange={(e) => setSimDelay(Math.max(0, parseInt(e.target.value) || 0))}
                  className="min-w-0 w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-black font-mono text-base sm:text-xs focus:outline-none focus:border-black font-bold"
                  placeholder="Durée personnalisée..."
                />
              </div>

              <select
                value={simDelayUnit}
                onChange={(e) => setSimDelayUnit(e.target.value as 'secondes' | 'minutes' | 'heures')}
                className="shrink-0 px-3 py-2.5 rounded-xl bg-neutral-100 border border-neutral-300 text-black text-xs font-bold focus:outline-none focus:border-black cursor-pointer"
              >
                <option value="secondes">Secondes</option>
                <option value="minutes">Minutes</option>
                <option value="heures">Heures</option>
              </select>
            </div>
          </div>

          {/* Date de l'opération (Historique passé / Récent) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Date de l'opération (Historique)
              </label>
              <span className="text-[11px] font-mono font-bold text-black flex items-center gap-1">
                <Calendar className="w-3 h-3 text-neutral-500" />
                {simDateType === 'now' 
                  ? 'Maintenant' 
                  : simDateType === 'yesterday'
                  ? 'Hier'
                  : simDateType === '3days'
                  ? 'Il y a 3 jours'
                  : simDateType === 'last_month'
                  ? 'Mois dernier'
                  : customDateInput || 'Choisir date'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Direct', type: 'now' as const },
                { label: 'Hier', type: 'yesterday' as const },
                { label: '-3 jours', type: '3days' as const },
                { label: 'Mois passé', type: 'last_month' as const },
              ].map((d) => (
                <button
                  key={d.type}
                  type="button"
                  onClick={() => setSimDateType(d.type)}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all text-center ${
                    simDateType === d.type
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSimDateType('custom')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                  simDateType === 'custom'
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                }`}
              >
                Date libre
              </button>
              {simDateType === 'custom' && (
                <input
                  type="date"
                  value={customDateInput}
                  onChange={(e) => setCustomDateInput(e.target.value)}
                  className="min-w-0 flex-1 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-300 text-black text-base sm:text-xs font-mono font-bold focus:outline-none focus:border-black"
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-xs transition-all active:scale-[0.99] mt-1"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Déclencher la simulation</span>
          </button>
        </form>
      </div>

      {/* 6. Réinitialisation des Données */}
      <div className="p-4 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xs font-bold text-black uppercase tracking-wider truncate">
            Réinitialiser les données
          </h2>
          <p className="text-[11px] text-neutral-500 font-medium truncate">
            Restaure le profil, solde et flux par défaut
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetToDemoDefaults();
            showToast('Données réinitialisées');
          }}
          className="shrink-0 px-3.5 py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-black font-bold text-xs border border-neutral-200 flex items-center space-x-1.5 transition-all active:scale-95 shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Réinitialiser</span>
        </button>
      </div>

    </div>
  );
};
