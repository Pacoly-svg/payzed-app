import React from 'react';
import { LightHeroSection } from './LightHeroSection';
import { RecentTransactions } from './RecentTransactions';
import { QuickActionsGrid } from './QuickActionsGrid';
import { VaultsPreviewCard } from './VaultsPreviewCard';

export const ComptesScreen: React.FC = () => {
  return (
    <div className="min-h-full flex flex-col bg-white text-black space-y-4 pb-24">
      {/* 1. Hub Solde & Actions Piliers (Recharger, Transférer, Contacts) */}
      <LightHeroSection />

      {/* 2. Services & Opérations Rapides + Coffres + Historique des Transactions */}
      <div className="px-4 sm:px-5 space-y-4">
        <QuickActionsGrid />
        <VaultsPreviewCard />
        <RecentTransactions />
      </div>
    </div>
  );
};
