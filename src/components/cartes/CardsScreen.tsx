import React from 'react';
import { VirtualCard } from './VirtualCard';
import { CardSecurityControls } from './CardSecurityControls';
import { SpendingLimitSlider } from './SpendingLimitSlider';

export const CardsScreen: React.FC = () => (
  <div className="space-y-5">
    <h1 className="text-2xl font-extrabold tracking-tight">Ma carte</h1>
    <VirtualCard />
    <CardSecurityControls />
    <SpendingLimitSlider />
  </div>
);
