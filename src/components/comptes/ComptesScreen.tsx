import React from 'react';
import { LightHeroSection } from './LightHeroSection';
import { QuickActionsGrid } from './QuickActionsGrid';
import { RecentTransactions } from './RecentTransactions';

export const ComptesScreen: React.FC = () => (
  <div className="px-5 pt-4 pb-8 space-y-6">
    <LightHeroSection />
    <QuickActionsGrid />
    <RecentTransactions />
  </div>
);
