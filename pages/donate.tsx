// pages/donate.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { siteConfig } from '@/config/site';
import { geoFromCountry, GeoInfo } from '@/lib/geo';

type Donor = { id: string; name: string; amount?: number };
type Props = { initialGeo: GeoInfo };

const BASE_SUGGESTED_USD = [3, 10, 25, 50];
const PAYMENT_TARGET =
  siteConfig.links.paypal ?? siteConfig.links.sponsor ?? '#';

export default function DonatePage({ initialGeo }: Props) {
  const [country, setCountry] = useState(initialGeo.country);
  const [currency, setCurrency] = useState(initialGeo.currency);
  const [symbol, setSymbol] = useState(initialGeo.symbol);
  const [convertedSuggested, setConvertedSuggested] = useState<number[]>(
    initialGeo.suggested
  );
  const [amount, setAmount] = useState<number | ''>(
    initialGeo.suggested[1] ?? initialGeo.suggested[0] ?? 10
  );
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(true);
  const [loadingRates, setLoadingRates] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/donations')
      .then((r) => r.json())
      .then((json) => {
        if (mounted) setDonors(json.top ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingDonors(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // convert USD base amounts -> local currency using /api/exchange-rate
  useEffect(() => {
    let mounted = true;
    async function convert() {
      setLoadingRates(true);
      try {
        if (currency === 'USD') {
          const arr = BASE_SUGGESTED_USD.slice();
          if (!mounted) return;
          setConvertedSuggested(arr);
          setAmount(arr[1]);
          return;
        }

        const res = await fetch(`/api/exchange-rate?target=${currency}`);
        if (!res.ok) {
          // log and fallback
          const text = await res.text().catch(() => '');
          console.error(
            'exchange-rate response not ok',
            res.status,
            res.statusText,
            text
          );
          // fallback to server-provided suggestions
          if (mounted) {
            setConvertedSuggested(initialGeo.suggested);
            setAmount(initialGeo.suggested[1] ?? initialGeo.suggested[0]);
            setLoadingRates(false);
          }
          return;
        }

        const json = await res.json().catch((e) => {
          console.error('invalid json from exchange-rate', e);
          return null;
        });

        if (!json) {
          if (mounted) {
            setConvertedSuggested(initialGeo.suggested);
            setAmount(initialGeo.suggested[1] ?? initialGeo.suggested[0]);
            setLoadingRates(false);
          }
          return;
        }

        // json can be { base, target, rate, fetchedAt, error } or { base, rates: { ... } }
        const rate =
          typeof json.rate === 'number'
            ? json.rate
            : json.rates && json.rates[currency]
              ? json.rates[currency]
              : null;

        if (!rate) {
          console.warn(
            'exchange-rate: no rate for',
            currency,
            'payload:',
            json
          );
          if (mounted) {
            setConvertedSuggested(initialGeo.suggested);
            setAmount(initialGeo.suggested[1] ?? initialGeo.suggested[0]);
            setLoadingRates(false);
          }
          return;
        }

        // compute converted amounts with simple rounding heuristics
        const converted = BASE_SUGGESTED_USD.map((d) => {
          const val = d * rate;
          // rounding heuristics: round to nearest 10 for INR/JPY, else 1 decimal or integer
          if (symbol === '₹' || symbol === '¥')
            return Math.round(val / 10) * 10;
          if (val < 10) return Math.round(val * 10) / 10;
          return Math.round(val);
        });

        if (mounted) {
          setConvertedSuggested(converted);
          setAmount(converted[1]);
        }
      } catch (err: any) {
        console.error('convert error', err?.message ?? err);
        if (mounted) {
          setConvertedSuggested(initialGeo.suggested);
          setAmount(initialGeo.suggested[1] ?? initialGeo.suggested[0]);
        }
      } finally {
        if (mounted) setLoadingRates(false);
      }
    }

    convert();
    return () => {
      mounted = false;
    };
  }, [currency, initialGeo, symbol]);

  function chooseAmount(v: number) {
    setAmount(v);
  }

  function handleDonateClick() {
    if (!amount || amount === '' || Number(amount) <= 0) {
      alert('Please enter a valid donation amount.');
      return;
    }
    setProcessing(true);
    try {
      const url = new URL(PAYMENT_TARGET, window.location.href);
      url.searchParams.set('amount', String(amount));
      url.searchParams.set('currency', currency);
      url.searchParams.set('country', country);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <section className="rounded-lg bg-gradient-to-br from-white to-slate-50 p-6 md:p-10 shadow-sm border border-slate-100">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
          Support AirCrashDB — keep it free and independent
        </h1>
        <p className="mt-3 text-slate-700">
          Your donation helps cover hosting, archival storage, and maintenance
          so investigation reports remain accessible to everyone.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3 md:items-center">
          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-3">
              {(convertedSuggested.length > 0
                ? convertedSuggested
                : initialGeo.suggested
              ).map((a) => (
                <button
                  key={a}
                  onClick={() => chooseAmount(a)}
                  aria-pressed={amount === a}
                  className={`px-4 py-2 rounded-md font-semibold text-sm shadow-sm ${
                    amount === a
                      ? 'bg-sky-700 text-white'
                      : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {symbol}
                  {a}
                </button>
              ))}

              <div className="ml-1">
                <label className="sr-only">Custom amount</label>
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                  <span className="text-sm text-slate-600">{symbol}</span>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={amount === '' ? '' : String(amount)}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d.]/g, '');
                      setAmount(v === '' ? '' : Number(v));
                    }}
                    placeholder="Custom"
                    className="w-24 text-sm outline-none"
                    aria-label="Custom amount"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <span className="text-slate-600">Country</span>
                <select
                  value={country}
                  onChange={(e) => {
                    const next = e.target.value;
                    const g = geoFromCountry(next);
                    setCountry(g.country);
                    setCurrency(g.currency);
                    setSymbol(g.symbol);
                    setConvertedSuggested(g.suggested);
                    setAmount(g.suggested[1] ?? g.suggested[0]);
                  }}
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-sm"
                >
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="IN">India</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="JP">Japan</option>
                  <option value="CN">China</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <div className="text-sm text-slate-600">You will donate</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {symbol}
                {amount}
              </div>
              {loadingRates && (
                <div className="text-xs text-slate-500">
                  Converting amounts…
                </div>
              )}
            </div>

            <button
              onClick={handleDonateClick}
              disabled={processing}
              className="inline-flex items-center justify-center rounded-md bg-yellow-500 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-yellow-600 w-full md:w-auto"
            >
              {processing ? 'Processing…' : 'Donate now'}
            </button>

            <div className="text-xs text-slate-500 text-center md:text-right">
              <div>Secure payments</div>
              <div>Donations go to project funding</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded bg-white p-4 shadow-sm border border-slate-100">
          <h4 className="text-lg font-semibold">Why support us</h4>
          <p className="text-sm text-slate-600 mt-2">
            AirCrashDB is an independent archive of investigation reports.
            Donations allow us to:
          </p>
          <ul className="mt-3 list-inside list-disc text-sm text-slate-700 space-y-1">
            <li>Store and serve official investigation PDFs</li>
            <li>Maintain search and ingestion tools that keep data accurate</li>
            <li>
              Preserve archives so they remain accessible to researchers and
              families
            </li>
          </ul>
        </div>

        <aside className="rounded bg-white p-4 shadow-sm border border-slate-100">
          <h5 className="text-sm font-semibold">Top donors</h5>
          <div className="mt-3 max-h-40 overflow-auto">
            {loadingDonors ? (
              <div className="text-sm text-slate-500">Loading…</div>
            ) : donors.length === 0 ? (
              <div className="text-sm text-slate-500">
                No donors yet — be the first!
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {donors.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                  >
                    {d.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4">
            <Link href="/" className="text-xs text-slate-500 hover:underline">
              Back to archive
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

/**
 * server-side detection (same as earlier)
 */
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const headers = req.headers as Record<string, string | string[] | undefined>;
  const headerCountry =
    (headers['x-vercel-ip-country'] as string) ||
    (headers['cf-ipcountry'] as string) ||
    (headers['x-country-code'] as string) ||
    (headers['x-nf-client-geo-country'] as string) ||
    (headers['x-appengine-country'] as string) ||
    undefined;

  const cc =
    typeof headerCountry === 'string' && headerCountry.length === 2
      ? headerCountry.toUpperCase()
      : undefined;

  const geo = geoFromCountry(cc);
  return { props: { initialGeo: geo } };
};
