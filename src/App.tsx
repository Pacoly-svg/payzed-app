import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { decodePayload, type Payee } from './utils/payLink';
import { ensureNotifications } from './utils/notify';
import { BACK_PRIORITY, leaveApp, useBackHandler } from './utils/backStack';
import { BankingProvider, useBanking } from './context/BankingContext';
import { MobileFrame } from './components/common/MobileFrame';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { Toast } from './components/common/Toast';
import { ComptesScreen } from './components/comptes/ComptesScreen';
import { AppPinLock } from './components/security/AppPinLock';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotificationBanner } from './components/common/NotificationBanner';
import { KeyboardDebug } from './components/common/KeyboardDebug';
import { DemoProvider } from './context/DemoContext';

// Écrans et fenêtres chargés à la demande : démarrage plus rapide.
const StatsScreen = lazy(() => import('./components/statistiques/StatsScreen').then((m) => ({ default: m.StatsScreen })));
const CardsScreen = lazy(() => import('./components/cartes/CardsScreen').then((m) => ({ default: m.CardsScreen })));
const SettingsScreen = lazy(() => import('./components/parametres/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));
const QRCodeModal = lazy(() => import('./components/modals/QRCodeModal').then((m) => ({ default: m.QRCodeModal })));
const TransferModal = lazy(() => import('./components/modals/TransferModal').then((m) => ({ default: m.TransferModal })));
const SubscriptionsModal = lazy(() => import('./components/modals/SubscriptionsModal').then((m) => ({ default: m.SubscriptionsModal })));
const BillsModal = lazy(() => import('./components/modals/BillsModal').then((m) => ({ default: m.BillsModal })));
const TopUpModal = lazy(() => import('./components/modals/TopUpModal').then((m) => ({ default: m.TopUpModal })));
const TransactionDetailsModal = lazy(() => import('./components/modals/TransactionDetailsModal').then((m) => ({ default: m.TransactionDetailsModal })));
const WithdrawModal = lazy(() => import('./components/modals/WithdrawModal').then((m) => ({ default: m.WithdrawModal })));
const ServicesModal = lazy(() => import('./components/modals/ServicesModal').then((m) => ({ default: m.ServicesModal })));
const VaultsModal = lazy(() => import('./components/modals/VaultsModal').then((m) => ({ default: m.VaultsModal })));
const SettingsSheet = lazy(() => import('./components/parametres/SettingsSheet').then((m) => ({ default: m.SettingsSheet })));

const MODALS = {
  qr: QRCodeModal,
  scan: QRCodeModal,
  services: ServicesModal,
  withdraw: WithdrawModal,
  transfer: TransferModal,
  subscriptions: SubscriptionsModal,
  bills: BillsModal,
  topup: TopUpModal,
  vaults: VaultsModal,
  settings: SettingsSheet,
} as const;

const Screen: React.FC = () => {
  const { activeTab } = useBanking();
  if (activeTab === 'comptes') return <ComptesScreen />;
  return (
    <div className="px-5 pt-4 pb-8">
      {activeTab === 'statistiques' && <StatsScreen />}
      {activeTab === 'cartes' && <CardsScreen />}
      {activeTab === 'parametres' && <SettingsScreen />}
    </div>
  );
};

const PayzedApp: React.FC = () => {
  const { isLocked, activeTab, setActiveTab, activeModal, setActiveModal, selectedTransaction, showToast } = useBanking();

  // Liens profonds payzed://pay?name=…&tel=… (QR scanné avec l'appareil photo, lien partagé)
  const [pendingLink, setPendingLink] = useState<Payee | null>(null);
  useEffect(() => {
    let remove: (() => void) | undefined;
    void (async () => {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;
      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('appUrlOpen', ({ url }) => {
        const payee = decodePayload(url);
        if (payee) setPendingLink(payee);
      });
      remove = () => void handle.remove();
    })();
    return () => remove?.();
  }, []);
  // Notifications système : autorisation demandée au premier déverrouillage (Android 13+)
  useEffect(() => {
    if (!isLocked) void ensureNotifications();
  }, [isLocked]);

  // Ouvert seulement après déverrouillage par code PIN
  useEffect(() => {
    if (pendingLink && !isLocked) {
      setActiveModal('scan', { payee: pendingLink });
      setPendingLink(null);
    }
  }, [pendingLink, isLocked, setActiveModal]);
  const ActiveModal = activeModal ? MODALS[activeModal] : null;

  // Retour sur l'écran principal : onglet → Accueil, puis double appui pour quitter
  const lastBack = useRef(0);
  useBackHandler(
    () => {
      if (activeTab !== 'comptes') {
        setActiveTab('comptes');
        return true;
      }
      const now = Date.now();
      if (now - lastBack.current < 2000) {
        lastBack.current = 0;
        void leaveApp();
      } else {
        lastBack.current = now;
        showToast('Appuyez encore sur Retour pour quitter');
      }
      return true;
    },
    true,
    BACK_PRIORITY.root,
  );

  return (
    <>
      <MobileFrame header={<Header />} bottomNav={<BottomNav />} scrollKey={activeTab}>
        <ErrorBoundary key={activeTab}>
          <Suspense fallback={<div className="h-40" />}>
            <Screen />
          </Suspense>
        </ErrorBoundary>
      </MobileFrame>

      <ErrorBoundary key={activeModal ?? 'none'}>
        <Suspense fallback={null}>
          {ActiveModal && <ActiveModal />}
          {selectedTransaction && <TransactionDetailsModal />}
        </Suspense>
      </ErrorBoundary>

      {isLocked && <AppPinLock />}
      <NotificationBanner />
      <KeyboardDebug />
      <Toast />
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary fullScreen>
      <BankingProvider>
        <DemoProvider>
          <PayzedApp />
        </DemoProvider>
      </BankingProvider>
    </ErrorBoundary>
  );
}
