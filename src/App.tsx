import React, { Suspense, lazy } from 'react';
import { BankingProvider, useBanking } from './context/BankingContext';
import { MobileFrame } from './components/common/MobileFrame';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { Toast } from './components/common/Toast';
import { ComptesScreen } from './components/comptes/ComptesScreen';
import { AppPinLock } from './components/security/AppPinLock';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotificationBanner } from './components/common/NotificationBanner';
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
const VaultsModal = lazy(() => import('./components/modals/VaultsModal').then((m) => ({ default: m.VaultsModal })));

const MODALS = {
  qr: QRCodeModal,
  scan: QRCodeModal,
  transfer: TransferModal,
  subscriptions: SubscriptionsModal,
  bills: BillsModal,
  topup: TopUpModal,
  vaults: VaultsModal,
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
  const { isLocked, activeTab, activeModal, selectedTransaction } = useBanking();
  const ActiveModal = activeModal ? MODALS[activeModal] : null;

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
