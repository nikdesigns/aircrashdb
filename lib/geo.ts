// lib/geo.ts
export type GeoInfo = {
  country: string; // ISO 3166-1 alpha-2, e.g. "US", "IN"
  currency: string; // ISO 4217, e.g. "USD", "INR"
  suggested: number[]; // suggested donation amounts in that currency
  symbol: string; // currency symbol for UI
};

/**
 * Minimal mappings. Extend as needed.
 * Values in SUGGESTED_BY_CURRENCY are intentionally human-friendly,
 * e.g. INR suggestions are much higher than USD to feel meaningful.
 */
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD',
  IN: 'INR',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  DE: 'EUR',
  FR: 'EUR',
  NL: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  JP: 'JPY',
  CN: 'CNY',
  // add more if needed
};

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$',
  INR: '₹',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  EUR: '€',
  JPY: '¥',
  CNY: '¥',
};

const SUGGESTED_BY_CURRENCY: Record<string, number[]> = {
  USD: [3, 10, 25, 50],
  EUR: [3, 10, 25, 50],
  GBP: [3, 10, 25, 50],
  INR: [100, 500, 1000, 2500], // INR: amounts that feel meaningful in INR
  CAD: [4, 10, 25, 50],
  AUD: [4, 10, 25, 50],
  JPY: [300, 1000, 3000, 5000],
  CNY: [20, 50, 150, 300],
};

/**
 * Returns GeoInfo for given 2-letter country code (case-insensitive).
 * Defaults to USD / US when unknown.
 */
export function geoFromCountry(countryCode?: string): GeoInfo {
  const cc = (countryCode || 'US').toUpperCase();
  const currency = COUNTRY_TO_CURRENCY[cc] ?? 'USD';
  const suggested =
    SUGGESTED_BY_CURRENCY[currency] ?? SUGGESTED_BY_CURRENCY['USD'];
  const symbol = CURRENCY_SYMBOL[currency] ?? '$';
  return {
    country: cc,
    currency,
    suggested,
    symbol,
  };
}
