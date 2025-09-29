// components/RelatedReports.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDateDeterministic as fmtDate } from '@/utils/formatDate';

export default function RelatedReports({
  operator,
  tags,
  currentId,
}: {
  operator?: string | null;
  tags?: string[] | null;
  currentId?: string;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!operator && (!tags || tags.length === 0)) return;

      setLoading(true);
      setError(null);
      try {
        const url = new URL('/api/reports/related', window.location.origin);
        if (operator) url.searchParams.set('operator', operator);
        if (tags && tags.length) url.searchParams.set('tags', tags.join(','));
        if (currentId) url.searchParams.set('exclude', currentId);
        url.searchParams.set('limit', '5');

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Failed ${res.status}`);
        const json = await res.json();

        // ✅ FIX: use json.reports instead of treating json as an array
        const list = Array.isArray(json.reports) ? json.reports : [];
        setItems(list);
      } catch (err: any) {
        console.error('RelatedReports load error', err);
        setError(err?.message ?? 'Failed to load related reports');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [operator, tags, currentId]);

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (error) return <div className="text-sm text-rose-600">{error}</div>;
  if (!items || items.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold mb-3">Related reports</h2>
      <div className="grid gap-3">
        {items.map((r) => (
          <Link
            key={r._id ?? r.id}
            href={`/reports/${r.slug ?? r._id}`}
            className="flex items-center gap-3 rounded border p-2 hover:bg-slate-50"
          >
            <div className="w-20 h-14 rounded overflow-hidden bg-slate-100">
              {r.thumbnail ? (
                <Image
                  src={r.thumbnail}
                  alt={r.title ?? ''}
                  width={160}
                  height={100}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  No image
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">
                {r.title ?? '—'}
              </div>
              <div className="text-xs text-slate-500">
                {fmtDate(r.date)} · {r.operator ?? '—'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
