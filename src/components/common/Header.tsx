import React, { useState } from 'react';
import { 
  Bell, 
  ChevronDown, 
  Smartphone, 
  Monitor, 
  Check,
  Lock,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { CURRENCIES } from '../../utils/formatters';
import type { CurrencyCode } from '../../types/banking';
import { CountryFlag, type CountryCode } from './CountryFlag';
import { PayzedLogo } from './PayzedLogo';
import { BrandLogo } from './BrandLogo';

interface CountryItem {
  countryCode: CountryCode;
  currencyCode: CurrencyCode;
  countryName: string;
}

const COUNTRIES: CountryItem[] = [
  { countryCode: 'SN', currencyCode: 'XOF', countryName: 'Sénégal (UEMOA)' },
  { countryCode: 'CI', currencyCode: 'XOF', countryName: 'Côte d’Ivoire (UEMOA)' },
  { countryCode: 'FR', currencyCode: 'EUR', countryName: 'France (Zone Euro)' },
  { countryCode: 'US', currencyCode: 'USD', countryName: 'États-Unis (Dollar)' },
  { countryCode: 'GB', currencyCode: 'GBP', countryName: 'Royaume-Uni (Livre)' },
];

export const Header: React.FC = () => {
  const { 
    user, 
    updateUser,
    currency, 
    setCurrency, 
    isPhoneMockup, 
    setIsPhoneMockup,
    lockApp,
    setActiveTab,
    showToast 
  } = useBanking();
  
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const currentCountry = (user.countryCode || 'SN') as CountryCode;

  const handleSelectCountry = (item: CountryItem) => {
    updateUser({ countryCode: item.countryCode });
    setCurrency(item.currencyCode);
    setShowCountryDropdown(false);
    showToast(`Zone active : ${item.countryName} (${item.currencyCode})`);
  };

  const notifications = [
    { 
      id: 1, 
      title: 'Virement reçu',
      text: '450 000 FCFA de Babacar Sy', 
      time: 'Il y a 30 min',
      brand: '',
      type: 'in'
    },
    { 
      id: 2, 
      title: 'Transfert Wave',
      text: '350 000 FCFA de Cheikh Ndiaye', 
      time: 'Il y a 2h',
      brand: 'wave',
      type: 'in'
    },
    { 
      id: 3, 
      title: 'Facture Électricité',
      text: 'Facture Senelec 45 000 FCFA réglée', 
      time: 'Il y a 4h',
      brand: 'senelec',
      type: 'out'
    },
    { 
      id: 4, 
      title: 'Recharge Mobilité',
      text: 'Pass Rapido Autoroute 25 000 FCFA', 
      time: 'Hier',
      brand: 'rapido',
      type: 'out'
    },
  ];

  return (
    <header className="relative z-30 px-4 pt-3.5 pb-3 flex items-center justify-between border-b border-neutral-100 bg-white/95 backdrop-blur-md transition-colors">
      {/* Logo Officiel Payzed (Noir haute précision) */}
      <div className="flex items-center space-x-2">
        <PayzedLogo className="text-black" size="md" />
      </div>

      {/* Contrôles droits : Devise, Smartphone Mockup, Notifications, Verrouillage, Profil */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Bascule Cadre Smartphone (Desktop) */}
        <button
          onClick={() => {
            const nextVal = !isPhoneMockup;
            setIsPhoneMockup(nextVal);
            showToast(nextVal ? 'Mode Smartphone activé' : 'Mode Plein Écran activé');
          }}
          title={isPhoneMockup ? 'Passer en plein écran' : 'Passer en mockup smartphone'}
          className="hidden sm:flex p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 hover:text-black border border-neutral-200/80 transition-all"
        >
          {isPhoneMockup ? (
            <Monitor className="w-3.5 h-3.5 text-black" />
          ) : (
            <Smartphone className="w-3.5 h-3.5 text-black" />
          )}
        </button>

        {/* Sélecteur de Pays / Devise */}
        <div className="relative">
          <button
            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200/80 text-xs font-semibold text-neutral-900 transition-all active:scale-95"
            title="Changer de pays et de devise"
          >
            <CountryFlag country={currentCountry} />
            <span className="font-mono text-[11px] text-neutral-800 font-bold">{currency}</span>
            <ChevronDown className={`w-3 h-3 text-neutral-500 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showCountryDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowCountryDropdown(false)} 
              />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-1.5 z-50 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                  Devise & Région
                </div>
                {COUNTRIES.map((item) => {
                  const isSelected = currentCountry === item.countryCode && currency === item.currencyCode;
                  const curr = CURRENCIES[item.currencyCode];

                  return (
                    <button
                      key={item.countryCode}
                      onClick={() => handleSelectCountry(item)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                        isSelected 
                          ? 'bg-black text-white font-semibold shadow-xs' 
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <CountryFlag country={item.countryCode} />
                        <div className="flex flex-col">
                          <span className={`text-[11px] font-medium ${isSelected ? 'text-white' : 'text-neutral-900'}`}>{item.countryName}</span>
                          <span className={`text-[9px] font-mono ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>{curr.label}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 hover:text-black border border-neutral-200/80 transition-all relative"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5 text-neutral-700" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-black shadow-xs" />
        </button>

        {/* Verrouiller la session (PIN) */}
        <button
          onClick={lockApp}
          title="Verrouiller la session (Code PIN)"
          className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 hover:text-black border border-neutral-200/80 transition-all active:scale-95"
        >
          <Lock className="w-3.5 h-3.5 text-neutral-700" />
        </button>

        {/* Avatar Utilisateur Dynamique (Photo ou Monogramme) */}
        <button 
          onClick={() => setActiveTab('parametres')}
          title="Mon Profil & Paramètres"
          className="relative flex items-center group active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-300 bg-neutral-900 text-white flex items-center justify-center font-bold text-xs font-mono shadow-xs group-hover:ring-2 group-hover:ring-black transition-all">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
            )}
          </div>
        </button>
      </div>

      {/* Panneau Déroulant Notifications - Parfaitement encadré dans le viewport, 0 débordement gauche/droite */}
      {showNotifications && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" 
            onClick={() => setShowNotifications(false)} 
          />
          <div className="absolute left-3 right-3 sm:left-auto sm:right-4 top-full mt-2 sm:w-84 max-w-sm rounded-3xl bg-white p-3.5 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-neutral-200/90 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-1.5 py-1 border-b border-neutral-100 mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-neutral-900 tracking-tight">Notifications</span>
                <span className="text-[10px] font-bold text-neutral-700 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200">
                  Activité récente
                </span>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-[11px] text-neutral-400 hover:text-black font-bold px-1.5 py-0.5 rounded-md hover:bg-neutral-100 transition-colors"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-1 max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <div 
                  key={n.id}
                  className="p-2 rounded-2xl hover:bg-neutral-50 transition-colors text-left flex items-center space-x-2.5"
                >
                  <div className="shrink-0">
                    {n.brand ? (
                      <BrandLogo brand={n.brand} size={32} className="w-8 h-8 rounded-xl shrink-0" />
                    ) : (
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                        n.type === 'in' 
                          ? 'bg-neutral-100 border-neutral-200 text-black' 
                          : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                      }`}>
                        {n.type === 'in' ? (
                          <ArrowDownLeft className="w-4 h-4 stroke-[2]" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 stroke-[2]" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-black truncate">{n.title}</h4>
                      <span className="text-[9px] text-neutral-400 font-mono shrink-0 ml-1">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 font-medium leading-tight truncate mt-0.5">{n.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
};
