import type { VirtualCardData } from '../types/banking';

/** Nouveau numéro Visa valide (contrôle de Luhn), CVV et date d'expiration à 4 ans. */
export function newCardDetails(): Pick<VirtualCardData, 'id' | 'fullNumber' | 'maskedNumber' | 'cvv' | 'expiryMonth' | 'expiryYear'> {
  const digits = [4, 5, 3, 2, ...Array.from({ length: 11 }, () => Math.floor(Math.random() * 10))];
  const sum = digits
    .slice()
    .reverse()
    .reduce((acc, d, i) => acc + (i % 2 === 0 ? (d * 2 > 9 ? d * 2 - 9 : d * 2) : d), 0);
  digits.push((10 - (sum % 10)) % 10);
  const num = digits.join('').replace(/(\d{4})(?=\d)/g, '$1 ');
  const exp = new Date();
  exp.setFullYear(exp.getFullYear() + 4);
  return {
    id: `card_${Date.now()}`,
    fullNumber: num,
    maskedNumber: `${num.slice(0, 4)} •••• •••• ${num.slice(-4)}`,
    cvv: String(Math.floor(100 + Math.random() * 900)),
    expiryMonth: String(exp.getMonth() + 1).padStart(2, '0'),
    expiryYear: String(exp.getFullYear()).slice(-2),
  };
}
