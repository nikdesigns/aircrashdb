// components/CurrencyBanner.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { geoFromCountry } from '@/lib/geo';

const BASE_AMOUNTS_USD = [3, 10, 25, 50];

function niceRound(amount: number, currencySymbol: string) {
  // round to sensible steps per currency
  if (currencySymbol === '₹' || currencySymbol === '¥') {
    // round to nearest 10
    return Math.round(amount / 10) * 10;
  }
  // otherwise, round to 1 decimal if small, else integer or 2 decimals
  if (amount < 10) return Math.round(amount * 10) / 10;
  return Math.round(amount);
}

export default function CurrencyBanner() {
  const [currency, setCurrency] = useState<string>('USD');
  const [symbol, setSymbol] = useState<string>('$');
  const [converted, setConverted] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // detect region from navigator.language
    try {
      const nav = window.navigator;
      const lang = (nav.languages && nav.languages[0]) || nav.language || '';
      const parts = lang.split(/[-_]/);
      const region = parts.length > 1 ? parts[1].toUpperCase() : undefined;
      const g = geoFromCountry(region);
      setCurrency(g.currency);
      setSymbol(g.symbol);
    } catch {
      setCurrency('USD');
      setSymbol('$');
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        if (currency === 'USD') {
          // no conversion needed
          const arr = BASE_AMOUNTS_USD.map((a) => niceRound(a, '$'));
          if (mounted) setConverted(arr);
          return;
        }
        const res = await fetch(`/api/exchange-rate?target=${currency}`);
        if (!res.ok) throw new Error('rate fetch failed');
        const json = await res.json();
        const rate = json.rate;
        const arr = BASE_AMOUNTS_USD.map((a) => niceRound(a * rate, symbol));
        if (mounted) setConverted(arr);
      } catch (err) {
        console.error(err);
        // fallback: show USD amounts
        if (mounted) setConverted(BASE_AMOUNTS_USD.map((a) => a));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [currency, symbol]);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-800">
            Support the project
          </div>
          <div className="text-slate-600 text-xs">
            Suggested donation amounts (local currency)
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading && (
            <div className="text-sm text-slate-500">Detecting currency…</div>
          )}
          {!loading && converted && (
            <div className="flex items-center gap-2">
              {converted.map((amt, i) => (
                <div
                  key={i}
                  className="rounded-md border border-slate-100 bg-slate-50 px-3 py-1 text-sm"
                >
                  {symbol}
                  {amt}
                </div>
              ))}
            </div>
          )}
          {!loading && !converted && <div className="text-slate-500">—</div>}

          <Link
            href="/donate"
            className="ml-4 rounded bg-yellow-500 px-3 py-1 text-sm font-semibold text-white hover:bg-yellow-600"
          >
            Donate
          </Link>
        </div>
      </div>
    </div>
  );
}
