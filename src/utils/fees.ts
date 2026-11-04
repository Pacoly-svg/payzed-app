/** Frais Payzed sur les envois et paiements : 1 % du montant (arrondi au franc). */
export const FEE_RATE = 0.01;
export const feeFor = (amount: number) => (amount > 0 ? Math.max(1, Math.round(amount * FEE_RATE)) : 0);
