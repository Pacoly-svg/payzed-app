import React from 'react';
import { BankingProvider, useBanking } from './context/BankingContext';
import { MobileFrame } from './components/common/MobileFrame';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { Toast } from './components/common/Toast';
import { ComptesScreen } from './components/comptes/ComptesScreen';
import { StatsScreen } from './components/statistiques/StatsScreen';
import { CardsScreen } from './components/cartes/CardsScreen';
import { SettingsScreen } from './components/parametres/SettingsScreen';

// Modals & Screens
import { QRCodeModal } from './components/modals/QRCodeModal';
import { TransferModal } from './components/modals/TransferModal';
import { SubscriptionsModal } from './components/modals/SubscriptionsModal';
import { BillsModal } from './components/modals/BillsModal';
import { TopUpModal } from './components/modals/TopUpModal';
import { TransactionDetailsModal } from './components/modals/TransactionDetailsModal';
import { NewCardModal } from './components/modals/NewCardModal';
import { VaultsModal } from './components/modals/VaultsModal';
import { OnboardingScreen } from './components/onboarding/OnboardingScreen';
import { AppPinLock } from './components/security/AppPinLock';
import { InAppNotificationBanner } from './components/common/InAppNotificationBanner';
import { SplashScreen } from './components/common/SplashScreen';

const MainScreenContent: React.FC = () => {
  const { activeTab } = useBanking();

  return (
    <main className="flex-1 bg-white text-black">
      {activeTab === 'comptes' && <ComptesScreen />}
      {activeTab === 'statistiques' && <div className="px-4 py-3 bg-white min-h-full"><StatsScreen /></div>}
      {activeTab === 'cartes' && <div className="px-4 py-3 bg-white min-h-full"><CardsScreen /></div>}
      {activeTab === 'parametres' && <div className="px-4 py-3 bg-white min-h-full"><SettingsScreen /></div>}
    </main>
  );
};

const PayzedApp: React.FC = () => {
  const { isLocked } = useBanking();
  const [showSplash, setShowSplash] = React.useState(true);

  return (
    <MobileFrame bottomNav={<BottomNav />}>
      {/* Launch Splash Screen Animation */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Top Interactive Push Notification Banner */}
      <InAppNotificationBanner />

      <Header />
      <MainScreenContent />

      {/* Global Modals */}
      <QRCodeModal />
      <TransferModal />
      <SubscriptionsModal />
      <BillsModal />
      <TopUpModal />
      <TransactionDetailsModal />
      <NewCardModal />
      <VaultsModal />

      {/* Welcome / Onboarding Screen */}
      <OnboardingScreen />

      {/* 4-Digit Security PIN Lock Screen */}
      {isLocked && <AppPinLock />}

      {/* Global Toast */}
      <Toast />
    </MobileFrame>
  );
};

export default function App() {
  return (
    <BankingProvider>
      <PayzedApp />
    </BankingProvider>
  );
}
