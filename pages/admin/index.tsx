// pages/admin/index.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Report as ReportType } from '@/components/CompactCard';

export default function AdminIndexPage() {
  const [reports, setReports] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports?page=1&limit=500');
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
      const data = await res.json();
      setReports(data.reports ?? []);
    } catch (err: any) {
      console.error('fetchAll error', err);
      setError(err?.message ?? 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm('Delete this report? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      console.error('Delete error', err);
      alert('Delete failed: ' + (err?.message ?? 'unknown'));
    }
  };

  const filtered = reports.filter((r) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      (r.title ?? '').toLowerCase().includes(q) ||
      (r.summary ?? '').toLowerCase().includes(q) ||
      (r.operator ?? '').toLowerCase().includes(q) ||
      (r.site ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin — Reports</h1>
          <p className="text-sm text-slate-600">
            List, edit, and delete reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/new-report"
            className="rounded bg-indigo-600 px-3 py-2 text-white"
          >
            New report
          </Link>
          <button onClick={fetchAll} className="rounded border px-3 py-2">
            Refresh
          </button>
        </div>
      </header>

      <div className="mb-4">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by title, summary, operator or site"
          className="w-full rounded border px-3 py-2"
        />
      </div>

      {error && <div className="mb-4 text-sm text-rose-600">{error}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-sm text-slate-500">No reports</div>
          ) : (
            filtered.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 rounded border p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {r.thumbnail ? (
                    <img
                      src={r.thumbnail}
                      alt={r.title}
                      className="w-20 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-12 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                      No image
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold truncate">
                        {r.title}
                      </div>
                      <div className="text-xs text-slate-500">
                        {r.type ?? '—'}
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 truncate max-w-[40rem]">
                      {r.summary}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {r.date ?? '—'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Link
                    href={`/reports/${r.id}`}
                    className="text-xs px-2 py-1 rounded border"
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/edit/${r.id}`}
                    className="text-xs px-2 py-1 rounded border"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => onDelete(r.id)}
                    className="text-xs px-2 py-1 rounded border text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
