// pages/api/exchange-rate.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type ApiResp = {
  base: string;
  rates: Record<string, number | null>;
  fetchedAt: number;
  provider?: string;
  error?: string | null;
  note?: string | null;
};

const CACHE_TTL_MS = Number(
  process.env.EXCHANGE_CACHE_TTL_MS ?? 1000 * 60 * 60
); // 1 hour

// simple in-memory cache
let CACHE: { ts: number; data: ApiResp } | null = null;

// helper: fetch with timeout
async function fetchWithTimeout(url: string, timeout = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Try provider: exchangerate.host
async function tryExchangerateHost() {
  const url = 'https://api.exchangerate.host/latest?base=USD&places=6';
  const res = await fetchWithTimeout(url, 7000);
  if (!res.ok) throw new Error(`exchangerate.host ${res.status}`);
  const json = await res.json();
  // json.rates expected
  if (!json || typeof json !== 'object' || !json.rates)
    throw new Error('exchangerate.host: missing rates');
  return {
    base: json.base ?? 'USD',
    rates: json.rates,
    provider: 'exchangerate.host',
  };
}

// Try provider: ER-API (https://open.er-api.com)
async function tryErApi() {
  const url = 'https://open.er-api.com/v6/latest/USD';
  const res = await fetchWithTimeout(url, 7000);
  if (!res.ok) throw new Error(`er-api ${res.status}`);
  const json = await res.json();
  // json.rates expected; some responses contain 'result' or 'rates'
  if (!json || typeof json !== 'object')
    throw new Error('er-api: invalid json');
  if (!json.rates) throw new Error('er-api: missing rates');
  return { base: json.base ?? 'USD', rates: json.rates, provider: 'er-api' };
}

// Try provider: Frankfurter
async function tryFrankfurter() {
  // Frankfurter uses from=USD
  const url = 'https://api.frankfurter.app/latest?from=USD';
  const res = await fetchWithTimeout(url, 7000);
  if (!res.ok) throw new Error(`frankfurter ${res.status}`);
  const json = await res.json();
  if (!json || typeof json !== 'object' || !json.rates)
    throw new Error('frankfurter: missing rates');
  return {
    base: json.base ?? 'USD',
    rates: json.rates,
    provider: 'frankfurter',
  };
}

// Useful currencies we want to return by default
const DEFAULT_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'INR',
  'CAD',
  'AUD',
  'JPY',
  'CNY',
] as const;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Return cached if fresh
    const now = Date.now();
    if (CACHE && now - CACHE.ts < CACHE_TTL_MS) {
      res.setHeader(
        'Cache-Control',
        `public, s-maxage=${Math.floor(CACHE_TTL_MS / 1000)}, stale-while-revalidate=60`
      );
      return res.status(200).json(CACHE.data);
    }

    // Order of providers to try
    const providers = [tryExchangerateHost, tryErApi, tryFrankfurter];

    let successful: {
      base: string;
      rates: Record<string, number>;
      provider: string;
    } | null = null;
    let lastError: any = null;

    for (const p of providers) {
      try {
        const out = await p();
        // ensure rates is a plain object and contains some numeric values
        const ratesObj = out.rates;
        const numericCount = Object.values(ratesObj).filter(
          (v) => typeof v === 'number' && isFinite(v)
        ).length;
        if (numericCount > 0) {
          // normalize to plain number map
          const normalized: Record<string, number> = {};
          for (const [k, v] of Object.entries(ratesObj)) {
            if (typeof v === 'number' && isFinite(v))
              normalized[k.toUpperCase()] = v;
          }
          successful = {
            base: out.base ?? 'USD',
            rates: normalized,
            provider: out.provider ?? 'unknown',
          };
          break;
        } else {
          lastError = `provider ${out.provider ?? 'unknown'} returned no numeric rates`;
        }
      } catch (err) {
        lastError = err;
        // try next provider
      }
    }

    // If no provider worked, use a safe fallback map (coarse, but prevents client crashes)
    if (!successful) {
      console.error('exchange-rate: all providers failed:', lastError);
      const fallbackRates: Record<string, number> = {
        USD: 1,
        EUR: 0.92,
        GBP: 0.78,
        INR: 83,
        CAD: 1.34,
        AUD: 1.5,
        JPY: 156,
        CNY: 7.2,
      };
      const fallbackResp: ApiResp = {
        base: 'USD',
        rates: Object.fromEntries(
          DEFAULT_CURRENCIES.map((c) => [c, fallbackRates[c] ?? null])
        ),
        fetchedAt: Date.now(),
        provider: 'fallback',
        error:
          typeof lastError === 'string'
            ? lastError
            : (lastError?.message ?? String(lastError)),
        note: 'All upstream providers failed; returning fallback rates.',
      };
      CACHE = { ts: Date.now(), data: fallbackResp };
      res.setHeader(
        'Cache-Control',
        `public, s-maxage=${Math.floor(CACHE_TTL_MS / 1000)}, stale-while-revalidate=60`
      );
      return res.status(200).json(fallbackResp);
    }

    // We have a successful provider with numeric rates
    const { base, rates, provider } = successful;

    // Build a response containing only the currencies we want (rest available too if desired)
    const pick: Record<string, number | null> = {};
    for (const k of DEFAULT_CURRENCIES) {
      pick[k] = rates[k] ?? null;
    }

    const goodResp: ApiResp = {
      base: base ?? 'USD',
      rates: pick,
      fetchedAt: Date.now(),
      provider,
      error: null,
    };

    // cache and respond
    CACHE = { ts: Date.now(), data: goodResp };
    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${Math.floor(CACHE_TTL_MS / 1000)}, stale-while-revalidate=60`
    );
    return res.status(200).json(goodResp);
  } catch (err: any) {
    console.error('exchange-rate handler unexpected error', err);
    const fallbackResp: ApiResp = {
      base: 'USD',
      rates: Object.fromEntries(DEFAULT_CURRENCIES.map((c) => [c, null])),
      fetchedAt: Date.now(),
      provider: 'none',
      error: String(err?.message ?? err),
    };
    return res.status(500).json(fallbackResp);
  }
}
