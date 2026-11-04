import React, { useEffect, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Copy,
  Crown,
  Gift,
  Headphones,
  LogOut,
  MessageCircle,
  Phone,
  Plus,
  Share2,
  Smartphone,
  UserPlus,
} from 'lucide-react';
import { useBanking, type AccountSummary } from '../../context/BankingContext';
import { useDemo } from '../../context/DemoContext';
import { formatCurrency } from '../../utils/formatters';
import { formatSnPhone, isSnMobile } from '../../utils/validators';
import { shareText } from '../../utils/share';
import { deviceSince, deviceSummary, type DeviceSummary } from '../../utils/device';
import { notificationStatus, requestNotifications } from '../../utils/notify';
import { ACCOUNT_LIMIT, INVITE_URL, PRO_PRICE, REFERRAL_BONUS, SUPPORT, referralCode } from '../../data/company';
import { Sheet } from '../common/Sheet';
import { Button, Field, IconBox, List, ReviewView, Row, SectionTitle, Segmented, SuccessView } from '../ui';

type Page = 'root' | 'add' | 'account' | 'referral' | 'devices' | 'plan' | 'pro' | 'proDone' | 'support' | 'logout';
type AccountType = AccountSummary['type'];

const TITLES: Record<Page, string> = {
  root: 'Réglages',
  add: 'Ajouter un compte',
  account: 'Compte',
  referral: 'Parrainer un ami',
  devices: 'Vos appareils',
  plan: 'Plan',
  pro: 'Passer à Pro',
  proDone: 'Payzed Pro',
  support: 'Service client',
  logout: 'Se déconnecter',
};

const typeLabel = (t: AccountType) => (t === 'business' ? 'Professionnel' : 'Personnel');
const digitsOf = (s: string) => s.replace(/\D/g, '').slice(-9);
const initialsOf = (name: string) =>
  name.trim().split(/\s+/).map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase() || 'PZ';

const Chevron = () => <ChevronRight className="w-5 h-5 text-neutral-400 shrink-0" />;

const Avatar: React.FC<{ name: string; src?: string; business?: boolean; size?: number; inverted?: boolean }> = ({ name, src, business, size = 44, inverted }) => (
  <span
    className={`rounded-full overflow-hidden flex items-center justify-center font-bold shrink-0 ${inverted ? 'bg-white text-black' : 'bg-black text-white'}`}
    style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
  >
    {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : business ? <Building2 style={{ width: size * 0.45, height: size * 0.45 }} /> : initialsOf(name)}
  </span>
);

const PlanBadge: React.FC<{ pro: boolean; inverted?: boolean }> = ({ pro, inverted }) => (
  <span
    className={`text-[11px] font-extrabold tracking-wide px-2 py-1 rounded-full shrink-0 ${
      pro ? (inverted ? 'bg-white text-black' : 'bg-black text-white') : inverted ? 'bg-white/15 text-white' : 'bg-neutral-200 text-neutral-600'
    }`}
  >
    {pro ? 'PRO' : 'GRATUIT'}
  </span>
);

const FAQ: [string, string][] = [
  ['Quels sont les frais ?', "Envois, paiements, achats, recharges et retraits : 1 % du montant, toujours affichés avant de confirmer. Recevoir de l'argent et déposer sont gratuits."],
  ["Comment retirer de l'argent en espèces ?", "Accueil › Retirer › Chez un agent. Vous obtenez un code valable 24 h à présenter à un agent Payzed."],
  ['Une opération a échoué : suis-je débité ?', "Non. Une opération échouée apparaît en rouge dans l'historique et aucun montant n'est débité."],
  ["J'ai perdu ma carte", "Onglet Carte › Bloquer pour la geler tout de suite, ou Remplacer pour détruire l'ancienne et recevoir un nouveau numéro."],
  ['Comment changer mon code PIN ?', 'Profil › Sécurité › Changer le code PIN.'],
  ['Comment masquer mon historique ?', "Sur l'accueil, touchez Masquer à côté de l'historique, ou Choisir pour masquer seulement certaines opérations."],
];

export const SettingsSheet: React.FC = () => {
  const { announce } = useDemo();
  const {
    setActiveModal,
    user,
    updateUser,
    balance,
    accounts,
    activeAccountId,
    addAccount,
    switchAccount,
    removeAccount,
    lockApp,
    showToast,
    addTransaction,
    isBiometricsEnabled,
  } = useBanking();
  const [page, setPage] = useState<Page>('root');
  const [selected, setSelected] = useState<AccountSummary | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmDowngrade, setConfirmDowngrade] = useState(false);
  // Nouveau compte
  const [type, setType] = useState<AccountType>('personal');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  // Appareil
  const [device, setDevice] = useState<DeviceSummary | null>(null);
  const [notif, setNotif] = useState<Awaited<ReturnType<typeof notificationStatus>> | null>(null);

  useEffect(() => {
    void deviceSummary().then(setDevice);
    void notificationStatus().then(setNotif);
  }, []);

  const close = () => setActiveModal(null);
  const go = (p: Page) => {
    setConfirmRemove(false);
    setConfirmDowngrade(false);
    setPage(p);
  };
  const pro = user.plan === 'pro';
  const code = referralCode(user.name, user.phone);
  const others = accounts.filter((a) => a.id !== activeAccountId);
  const limit = ACCOUNT_LIMIT[pro ? 'pro' : 'free'];
  const bonus = formatCurrency(REFERRAL_BONUS, 'XOF');

  const invite = async () => {
    const r = await shareText(
      'Rejoins-moi sur Payzed',
      `Rejoins-moi sur Payzed pour envoyer, recevoir et payer simplement. Avec mon code ${code}, on reçoit chacun ${bonus} après ta première opération. Télécharge l'app : ${INVITE_URL}`,
    );
    if (r === 'copied') showToast('Invitation copiée');
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('Code copié');
    } catch {
      showToast('Copie impossible');
    }
  };

  /* ----- Nouveau compte ----- */
  const errors = {
    name: name.trim().length < 2 && (type === 'business' ? "Entrez le nom de l'entreprise" : 'Entrez le nom complet'),
    phone: !isSnMobile(phone)
      ? 'Numéro sénégalais à 9 chiffres (ex. 77 123 45 67)'
      : accounts.some((a) => digitsOf(a.phone) === digitsOf(phone)) && 'Ce numéro a déjà un compte sur cet appareil',
  };
  const createAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (errors.name || errors.phone) return;
    (document.activeElement as HTMLElement | null)?.blur();
    addAccount({ name: name.trim(), phone: formatSnPhone(phone), type });
  };

  /* ----- Pro ----- */
  const activatePro = () => {
    if (balance < PRO_PRICE) {
      showToast('Solde insuffisant');
      go('plan');
      return;
    }
    const tx = addTransaction({
      title: 'Payzed Pro',
      subtitle: 'Abonnement mensuel',
      category: 'Services & Abonnements',
      type: 'subscription',
      amount: -PRO_PRICE,
      status: 'completed',
      icon: 'Shield',
      brandLogo: 'payzed',
      recipient: 'Payzed',
      fee: 0,
      paymentMethod: 'Compte Payzed',
    });
    updateUser({ plan: 'pro' });
    announce(tx, balance - PRO_PRICE);
    go('proDone');
  };

  const onBack = page === 'root' ? undefined : page === 'pro' ? () => go('plan') : () => go('root');
  const footer =
    page === 'add' && accounts.length < limit ? (
      <Button type="submit" form="add-account" className="w-full">
        Créer le compte
      </Button>
    ) : undefined;

  return (
    <Sheet
      title={page === 'account' && selected ? selected.name : TITLES[page]}
      onClose={close}
      onBack={onBack}
      confirmClose={page === 'add' && Boolean(name || phone)}
      footer={footer}
    >
      {page === 'root' && (
        <div className="space-y-6">
          {/* Compte actif */}
          <div className="rounded-3xl bg-black text-white p-4 flex items-center gap-3">
            <Avatar name={user.name} src={user.avatarUrl} business={user.accountType === 'business'} size={52} inverted />
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-bold truncate">{user.name}</p>
              <p className="text-[13px] text-white/60 truncate">{user.phone}</p>
              <p className="text-[13px] text-white/60 truncate">Compte {typeLabel(user.accountType ?? 'personal').toLowerCase()}</p>
            </div>
            <PlanBadge pro={pro} inverted />
          </div>

          <section className="space-y-3">
            <SectionTitle>Comptes</SectionTitle>
            <List>
              {others.map((a) => (
                <Row
                  key={a.id}
                  onClick={() => {
                    setSelected(a);
                    go('account');
                  }}
                  icon={<Avatar name={a.name} business={a.type === 'business'} />}
                  title={a.name}
                  subtitle={`${a.phone} · ${typeLabel(a.type)}`}
                  trailing={<Chevron />}
                />
              ))}
              <Row
                onClick={() => go('add')}
                icon={<IconBox><Plus className="w-5 h-5" /></IconBox>}
                title="Ajouter un autre compte"
                subtitle="Personnel ou professionnel"
                trailing={<Chevron />}
              />
            </List>
          </section>

          <section className="space-y-3">
            <SectionTitle>Amis</SectionTitle>
            <List>
              <Row
                onClick={() => void invite()}
                icon={<IconBox><UserPlus className="w-5 h-5" /></IconBox>}
                title="Inviter un ami"
                subtitle="Lien pour rejoindre Payzed"
                trailing={<Share2 className="w-5 h-5 text-neutral-400 shrink-0" />}
              />
              <Row
                onClick={() => go('referral')}
                icon={<IconBox><Gift className="w-5 h-5" /></IconBox>}
                title="Parrainer un ami"
                subtitle={`${bonus} pour vous et votre ami`}
                trailing={<Chevron />}
              />
            </List>
          </section>

          <section className="space-y-3">
            <SectionTitle>Compte et aide</SectionTitle>
            <List>
              <Row
                onClick={() => go('devices')}
                icon={<IconBox><Smartphone className="w-5 h-5" /></IconBox>}
                title="Vos appareils"
                subtitle={device ? `${device.name} · cet appareil` : 'Cet appareil'}
                trailing={<Chevron />}
              />
              <Row
                onClick={() => go('plan')}
                icon={<IconBox><Crown className="w-5 h-5" /></IconBox>}
                title="Plan"
                subtitle={pro ? 'Payzed Pro' : 'Gratuit · découvrir Pro'}
                trailing={<Chevron />}
              />
              <Row
                onClick={() => go('support')}
                icon={<IconBox><Headphones className="w-5 h-5" /></IconBox>}
                title="Service client"
                subtitle={pro ? 'Ligne prioritaire Pro' : 'Appel, WhatsApp, questions fréquentes'}
                trailing={<Chevron />}
              />
            </List>
          </section>

          <List>
            <Row
              onClick={() => go('logout')}
              icon={<IconBox className="text-red-600"><LogOut className="w-5 h-5" /></IconBox>}
              title={<span className="text-red-600">Se déconnecter</span>}
            />
          </List>
        </div>
      )}

      {page === 'account' && selected && (
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center pt-1">
            <Avatar name={selected.name} business={selected.type === 'business'} size={72} />
            <p className="mt-3 text-xl font-bold">{selected.name}</p>
            <p className="text-[15px] text-neutral-500">
              {selected.phone} · {typeLabel(selected.type)}
            </p>
          </div>
          <Button className="w-full" onClick={() => switchAccount(selected.id)}>
            Utiliser ce compte
          </Button>
          {confirmRemove ? (
            <div className="rounded-3xl bg-red-50 p-4 space-y-3">
              <p className="text-[15px] text-red-700">Le solde, l'historique et la carte de ce compte seront supprimés de cet appareil.</p>
              <Button
                className="w-full bg-red-600"
                onClick={() => {
                  removeAccount(selected.id);
                  go('root');
                }}
              >
                Retirer définitivement
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setConfirmRemove(false)}>
                Annuler
              </Button>
            </div>
          ) : (
            <Button variant="danger" className="w-full" onClick={() => setConfirmRemove(true)}>
              Retirer de cet appareil
            </Button>
          )}
        </div>
      )}

      {page === 'add' &&
        (accounts.length >= limit ? (
          <div className="space-y-4">
            <div className="rounded-3xl bg-neutral-100 p-5 text-center">
              <p className="text-[17px] font-bold">{limit} comptes au maximum</p>
              <p className="text-[15px] text-neutral-500 mt-1">
                {pro
                  ? `Payzed Pro permet jusqu'à ${limit} comptes sur un même appareil.`
                  : `Le plan Gratuit permet ${limit} comptes. Passez à Pro pour en avoir jusqu'à ${ACCOUNT_LIMIT.pro}.`}
              </p>
            </div>
            {!pro && (
              <Button className="w-full" onClick={() => go('plan')}>
                Découvrir Pro
              </Button>
            )}
          </div>
        ) : (
          <form id="add-account" noValidate onSubmit={createAccount} className="space-y-4">
            <Segmented
              value={type}
              onChange={setType}
              options={[
                { id: 'personal', label: 'Personnel' },
                { id: 'business', label: 'Professionnel' },
              ]}
            />
            <Field
              label={type === 'business' ? "Nom de l'entreprise" : 'Nom complet'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete={type === 'business' ? 'organization' : 'name'}
              enterKeyHint="next"
              error={showErrors && errors.name}
            />
            <Field
              label="Numéro de téléphone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="done"
              placeholder="77 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={showErrors && errors.phone}
            />
            <p className="text-[13px] text-neutral-500 px-1">
              Le nouveau compte a son propre solde, sa propre carte et son propre historique. Vous passez de l'un à l'autre depuis Réglages, sans
              ressaisir votre code.
            </p>
          </form>
        ))}

      {page === 'referral' && (
        <div className="space-y-5">
          <button type="button" onClick={() => void copyCode()} className="w-full rounded-3xl bg-black text-white p-5 text-center active:scale-[0.98] transition-transform">
            <span className="block text-[13px] text-white/60">Votre code de parrainage</span>
            <span className="block mt-1 text-[34px] font-extrabold tracking-[0.12em] tabular-nums">{code}</span>
            <span className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-white/60">
              <Copy className="w-3.5 h-3.5" /> Toucher pour copier
            </span>
          </button>
          <List>
            {[
              ['Partagez votre code', 'Par WhatsApp, SMS ou réseaux sociaux.'],
              ['Votre ami ouvre son compte', 'Il crée son compte Payzed avec votre code.'],
              ['Vous gagnez tous les deux', `${bonus} chacun après sa première opération.`],
            ].map(([t, s], i) => (
              <Row key={t} icon={<IconBox dark className="font-extrabold text-[15px]">{i + 1}</IconBox>} title={t} subtitle={s} />
            ))}
          </List>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-neutral-100 p-4">
              <p className="text-[13px] text-neutral-500">Amis parrainés</p>
              <p className="text-xl font-extrabold mt-0.5">0</p>
            </div>
            <div className="rounded-2xl bg-neutral-100 p-4">
              <p className="text-[13px] text-neutral-500">Primes gagnées</p>
              <p className="text-xl font-extrabold mt-0.5">{formatCurrency(0, 'XOF')}</p>
            </div>
          </div>
          <Button className="w-full" icon={<Share2 className="w-5 h-5" />} onClick={() => void invite()}>
            Partager mon code
          </Button>
        </div>
      )}

      {page === 'devices' && (
        <div className="space-y-5">
          <div className="rounded-3xl bg-neutral-100 p-4 flex items-center gap-3">
            <IconBox dark>
              <Smartphone className="w-5 h-5" />
            </IconBox>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold truncate">{device?.name ?? 'Cet appareil'}</p>
              <p className="text-[13px] text-neutral-500 truncate">{device ? (device.name === device.model ? device.os : `${device.model} · ${device.os}`) : '…'}</p>
            </div>
            <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-black text-white shrink-0">Cet appareil</span>
          </div>
          <List>
            <Row title="Connecté depuis" trailing={<span className="text-[15px] text-neutral-500">{new Date(deviceSince()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>} />
            <Row title="Déverrouillage" trailing={<span className="text-[15px] text-neutral-500">{isBiometricsEnabled ? 'Code ou empreinte' : 'Code PIN'}</span>} />
            <Row title="Version de Payzed" trailing={<span className="text-[15px] text-neutral-500">{__APP_VERSION__}</span>} />
            <Row
              title="Notifications"
              subtitle={notif === 'granted' ? 'Son du téléphone, comme un SMS' : notif === 'unsupported' ? "Dans l'application Android" : 'Désactivées'}
              trailing={
                notif === 'granted' ? (
                  <span className="text-[15px] font-semibold">Activées</span>
                ) : notif === 'unsupported' ? null : (
                  <Button
                    size="md"
                    onClick={async () => {
                      const ok = await requestNotifications();
                      setNotif(await notificationStatus());
                      if (!ok) showToast('Autorisez Payzed dans Réglages Android › Notifications');
                    }}
                  >
                    Activer
                  </Button>
                )
              }
            />
          </List>
          <p className="text-[13px] text-neutral-500 px-1">Aucun autre appareil n'est connecté à votre compte.</p>
        </div>
      )}

      {page === 'plan' && (
        <div className="space-y-3">
          <div className={`rounded-3xl p-5 bg-neutral-100 border-2 ${pro ? 'border-transparent' : 'border-black'}`}>
            <div className="flex items-center justify-between">
              <p className="text-[17px] font-extrabold">Gratuit</p>
              {!pro && <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-black text-white">Plan actuel</span>}
            </div>
            <p className="text-[15px] text-neutral-500">0 FCFA</p>
            <ul className="mt-3 space-y-1.5 text-[15px]">
              <li>Envois, paiements et retraits (frais 1 %)</li>
              <li>Carte Visa virtuelle</li>
              <li>{ACCOUNT_LIMIT.free} comptes sur l'appareil</li>
            </ul>
          </div>
          <div className="rounded-3xl p-5 bg-black text-white">
            <div className="flex items-center justify-between">
              <p className="text-[17px] font-extrabold inline-flex items-center gap-2">
                <Crown className="w-5 h-5" /> Pro
              </p>
              {pro && <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-white text-black">Plan actuel</span>}
            </div>
            <p className="text-[15px] text-white/60">{formatCurrency(PRO_PRICE, 'XOF')} / mois</p>
            <ul className="mt-3 space-y-1.5 text-[15px]">
              <li>Tout le plan Gratuit</li>
              <li>Jusqu'à {ACCOUNT_LIMIT.pro} comptes sur l'appareil</li>
              <li>Service client prioritaire</li>
              <li>Badge Pro sur votre profil</li>
            </ul>
          </div>
          <div className="pt-2">
            {pro ? (
              confirmDowngrade ? (
                <div className="rounded-3xl bg-neutral-100 p-4 space-y-3">
                  <p className="text-[15px] text-neutral-600">Les avantages Pro s'arrêtent tout de suite. Vos comptes déjà créés sont conservés.</p>
                  <Button
                    className="w-full"
                    onClick={() => {
                      updateUser({ plan: 'free' });
                      showToast('Vous êtes passé au plan Gratuit');
                      setConfirmDowngrade(false);
                    }}
                  >
                    Revenir au plan Gratuit
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setConfirmDowngrade(false)}>
                    Garder Pro
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" className="w-full" onClick={() => setConfirmDowngrade(true)}>
                  Revenir au plan Gratuit
                </Button>
              )
            ) : (
              <>
                <Button className="w-full" disabled={balance < PRO_PRICE} onClick={() => go('pro')}>
                  Passer à Pro · {formatCurrency(PRO_PRICE, 'XOF')} / mois
                </Button>
                {balance < PRO_PRICE && <p className="text-[13px] text-red-600 text-center mt-2">Solde insuffisant pour activer Pro</p>}
              </>
            )}
          </div>
        </div>
      )}

      {page === 'pro' && (
        <ReviewView
          caption="Abonnement mensuel"
          amount={formatCurrency(PRO_PRICE, 'XOF')}
          rows={[
            ['Plan', 'Payzed Pro'],
            ['Prélevé sur', 'Compte Payzed'],
            ['Renouvellement', 'Chaque mois, résiliable à tout moment'],
          ]}
          confirmLabel="Payer et activer Pro"
          onConfirm={activatePro}
          onEdit={() => go('plan')}
        />
      )}

      {page === 'proDone' && <SuccessView amount="Pro activé" text={`Service client prioritaire et jusqu'à ${ACCOUNT_LIMIT.pro} comptes.`} onDone={() => go('root')} />}

      {page === 'support' && (
        <div className="space-y-5">
          {pro && (
            <div className="rounded-2xl bg-black text-white px-4 py-3 flex items-center gap-3">
              <Crown className="w-5 h-5 shrink-0" />
              <p className="text-[15px] font-semibold">Ligne prioritaire Pro : vous êtes servi en premier.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${SUPPORT.phone}`}
              className="h-[84px] rounded-2xl bg-neutral-100 flex flex-col items-center justify-center gap-2 text-[15px] font-bold active:bg-neutral-200"
            >
              <Phone className="w-6 h-6" /> Appeler
            </a>
            <a
              href={`https://wa.me/${SUPPORT.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-[84px] rounded-2xl bg-neutral-100 flex flex-col items-center justify-center gap-2 text-[15px] font-bold active:bg-neutral-200"
            >
              <MessageCircle className="w-6 h-6" /> WhatsApp
            </a>
          </div>
          <p className="text-center text-[13px] text-neutral-500 -mt-2">{SUPPORT.display}</p>
          <section className="space-y-3">
            <SectionTitle>Questions fréquentes</SectionTitle>
            <div className="space-y-2">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group rounded-2xl bg-neutral-100 px-4 py-3.5">
                  <summary className="list-none flex items-center justify-between gap-3 text-[15px] font-semibold cursor-pointer [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown className="w-5 h-5 text-neutral-400 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-[15px] text-neutral-600">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      )}

      {page === 'logout' && (
        <div className="space-y-5">
          <p className="text-[15px] text-neutral-600">
            Vous devrez saisir votre code PIN pour revenir sur votre compte. Vos données restent enregistrées sur cet appareil.
          </p>
          <div className="space-y-2">
            <Button className="w-full bg-red-600" onClick={lockApp}>
              Se déconnecter
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => go('root')}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
};
