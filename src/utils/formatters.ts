import type { CurrencyCode, CurrencyConfig } from '../types/banking';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  XOF: {
    code: 'XOF',
    label: 'Franc CFA (BCEAO)',
    symbol: 'FCFA',
    symbolPosition: 'after',
    exchangeRateToEUR: 655.957, // 1 EUR = 655.957 XOF
    decimals: 0,
    countryName: 'Afrique de l’Ouest',
    flagIcon: 'CI',
  },
  EUR: {
    code: 'EUR',
    label: 'Euro (€)',
    symbol: '€',
    symbolPosition: 'after',
    exchangeRateToEUR: 1.0,
    decimals: 2,
    countryName: 'Zone Euro',
    flagIcon: 'FR',
  },
  USD: {
    code: 'USD',
    label: 'US Dollar ($)',
    symbol: '$',
    symbolPosition: 'before',
    exchangeRateToEUR: 1.08, // 1 EUR = 1.08 USD
    decimals: 2,
    countryName: 'États-Unis',
    flagIcon: 'US',
  },
  GBP: {
    code: 'GBP',
    label: 'British Pound (£)',
    symbol: '£',
    symbolPosition: 'before',
    exchangeRateToEUR: 0.86, // 1 EUR = 0.86 GBP
    decimals: 2,
    countryName: 'Royaume-Uni',
    flagIcon: 'GB',
  },
};

/**
 * Format currency amount cleanly according to fintech standards
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'XOF',
  options: { showSign?: boolean; hideFractions?: boolean } = {}
): string {
  const config = CURRENCIES[currencyCode];
  const absAmount = Math.abs(amount);
  
  let formattedNumber = '';
  
  if (currencyCode === 'XOF') {
    formattedNumber = Math.round(absAmount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  } else if (currencyCode === 'EUR') {
    const parts = absAmount.toFixed(options.hideFractions ? 0 : 2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
    formattedNumber = parts.join(',');
  } else {
    const parts = absAmount.toFixed(options.hideFractions ? 0 : 2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formattedNumber = parts.join('.');
  }

  let result = '';
  if (config.symbolPosition === 'before') {
    result = `${config.symbol}${formattedNumber}`;
  } else {
    result = `${formattedNumber}\u00A0${config.symbol}`;
  }

  if (options.showSign && amount > 0) {
    return `+${result}`;
  } else if (amount < 0) {
    return `-${result}`;
  }

  return result;
}

/**
 * Convert an amount from one currency to another using reference rates
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;
  const inEUR = amount / CURRENCIES[from].exchangeRateToEUR;
  const converted = inEUR * CURRENCIES[to].exchangeRateToEUR;
  return to === 'XOF' ? Math.round(converted) : Math.round(converted * 100) / 100;
}

/**
 * Format date in French fintech style
 */
export function formatTransactionDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((dayStart(now) - dayStart(date)) / 86_400_000);
  const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  if (diffDays === 0) return `Aujourd'hui, ${time}`;
  if (diffDays === 1) return `Hier, ${time}`;

  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const year = date.getFullYear() !== now.getFullYear() ? ` ${date.getFullYear()}` : '';
  return `${date.getDate()} ${months[date.getMonth()]}${year}, ${time}`;
}

export function maskCardNumber(fullNumber: string, showFull = false): string {
  const cleaned = fullNumber.replace(/\s+/g, '');
  if (cleaned.length < 16) return fullNumber;
  if (showFull) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)} ${cleaned.slice(12, 16)}`;
  }
  return `${cleaned.slice(0, 4)} •••• •••• ${cleaned.slice(12, 16)}`;
}
