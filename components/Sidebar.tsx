// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Donation = {
  id: string;
  name: string;
  amount: number;
  currency?: string;
  date: string; // ISO
  message?: string;
};

export default function Sidebar() {
  const [donations, setDonations] = useState<Donation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('/api/donations')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Donation[]) => {
        if (!mounted) return;
        // take top 5 by amount (server may already sort)
        const top = (data || [])
          .slice()
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
        setDonations(top);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error(err);
        setError('Could not load donations');
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <aside className="sticky top-[var(--site-nav-height)] hidden lg:block">
      <div className="flex w-full">
        <nav style={{ width: 'var(--sidebar-w)' }} className="pr-4">
          <div className="rounded-md bg-white/60 p-3 text-sm leading-snug">
            <div className="mb-3 text-xs font-semibold uppercase text-slate-500">
              Browse
            </div>

            <ul className="space-y-1">
              <li>
                <Link
                  href="/"
                  className="block rounded px-2 py-1 text-slate-800 hover:bg-slate-100"
                >
                  All reports
                </Link>
              </li>
              <li>
                <Link
                  href="/by-country"
                  className="block rounded px-2 py-1 text-slate-800 hover:bg-slate-100"
                >
                  By country
                </Link>
              </li>
              <li>
                <Link
                  href="/by-year"
                  className="block rounded px-2 py-1 text-slate-800 hover:bg-slate-100"
                >
                  By year
                </Link>
              </li>
              <li>
                <Link
                  href="/agencies"
                  className="block rounded px-2 py-1 text-slate-800 hover:bg-slate-100"
                >
                  Agencies
                </Link>
              </li>
            </ul>

            <div className="mt-4 border-t pt-3 text-xs text-slate-600">
              <div className="mb-2 font-medium text-slate-700">Tools</div>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/contribute"
                    className="block rounded px-2 py-1 text-slate-800 hover:bg-slate-100"
                  >
                    Contribute report
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="block rounded px-2 py-1 text-slate-800 hover:bg-slate-100"
                  >
                    About
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* spacer so main content doesn't hug the sidebar */}
        <div className="hidden lg:block w-4" />
      </div>
    </aside>
  );
}

/* helpers (kept local) */
function formatCurrency(amount: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}
