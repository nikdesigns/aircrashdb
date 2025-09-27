// pages/donate/success.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function genReceiptId() {
  const t = Date.now().toString(36).toUpperCase().slice(-6);
  const r = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ACDB-${t}-${r}`;
}

export default function DonateSuccessPage() {
  const params = useSearchParams();
  const rawAmount = params?.get('amount') ?? '';
  const currency = params?.get('currency') ?? '$';
  const name = params?.get('name') ?? '';

  const amount = rawAmount ? Number(rawAmount) || rawAmount : '—';

  // Start as empty so server and initial client render match
  const [receipt, setReceipt] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  // Generate receipt + date on client only (after hydration)
  useEffect(() => {
    setReceipt(genReceiptId());
    setDateStr(new Date().toLocaleString());
  }, []);

  // Confetti: light client-only visual effect. Create then remove elements.
  useEffect(() => {
    const root = document.getElementById('donate-confetti');
    if (!root) return;
    const dots: HTMLDivElement[] = [];
    for (let i = 0; i < 14; i++) {
      const d = document.createElement('div');
      d.className = 'confetti-dot';
      d.style.left = `${8 + i * 6}%`;
      root.appendChild(d);
      dots.push(d);
    }
    // remove after animation
    const t = setTimeout(() => {
      dots.forEach((el) => el.remove());
    }, 3600);
    return () => {
      clearTimeout(t);
      dots.forEach((el) => el.remove());
    };
  }, []);

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <div
        id="donate-confetti"
        className="pointer-events-none absolute inset-0 -z-10"
      />

      <section className="rounded-lg bg-white p-8 shadow-md border border-slate-100">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-emerald-50 p-3">
            <svg
              className="h-6 w-6 text-emerald-700"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-slate-900">
              Thank you{name ? `, ${name}` : ''}!
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Your donation helps keep AirCrashDB available and free. We really
              appreciate your support.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded border border-slate-100 bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600">Donation</div>
              <div className="text-sm font-semibold text-slate-900">
                {currency}
                {amount}
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <div>Reference</div>
              {/* show placeholder until client sets it */}
              <div>{receipt || '—'}</div>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <div>Date</div>
              <div>{dateStr || '—'}</div>
            </div>
          </div>

          <div className="rounded border border-slate-100 bg-white p-4 text-sm">
            <div className="font-medium text-slate-800">What happens next</div>
            <div className="mt-2 text-slate-600 text-sm">
              This is a demo success page. When you connect a payment processor
              (Stripe / Razorpay), real payments will be processed and you will
              receive a real receipt via the payment provider.
            </div>

            <ul className="mt-3 list-inside list-disc text-slate-700 text-sm">
              <li>
                If this were a real payment, receipts would be emailed by the
                gateway.
              </li>
              <li>
                We would record the donation securely and show it on the
                supporters page (names only).
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            href="/"
            className="flex-1 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 text-center"
          >
            Back to archive
          </Link>

          <Link
            href="/donate"
            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 text-center"
          >
            Give again
          </Link>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          <strong>Note:</strong> This is a demo success screen. Replace with
          your real webhook-confirmed success flow when integrating payments.
        </div>
      </section>

      <style jsx>{`
        .confetti-dot {
          position: absolute;
          top: 4%;
          width: 8px;
          height: 8px;
          background: linear-gradient(135deg, #fde68a, #fca5a5);
          border-radius: 999px;
          transform: translateY(0) scale(0.9);
          opacity: 0.95;
          animation: confetti-fall 2.8s ease-in forwards;
        }
        @keyframes confetti-fall {
          to {
            transform: translateY(320px) rotate(360deg) scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}
