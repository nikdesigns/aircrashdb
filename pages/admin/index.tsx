// pages/admin/index.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAdminAuth } from '@/lib/useAdminAuth';
import Image from 'next/image';
import Head from 'next/head';

type ImgItem = string | { url: string; caption?: string };

type ReportRow = {
  id: string | null;
  _id?: string | null;
  title?: string | null;
  date?: string | null;
  type?: string | null;
  operator?: string | null;
  thumbnail?: string | null;
  fatalities?: number | null;
  injuries?: number | null;
  survivors?: number | null;
  // keep any extra fields from server
  [k: string]: any;
};

export default function AdminIndexPage() {
  const router = useRouter();
  const { checking, authenticated } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (checking) return;
    if (!authenticated) return;
    loadReports();
  }, [checking, authenticated]);

  async function loadReports() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports?limit=100');
      if (!res.ok) {
        // try to surface server message
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed to load: ${res.status}`);
      }
      const data = await res.json();

      // Normalize each report so UI always has `id` (string)
      const list = (data.reports || []).map((r: any) => {
        // server might return _id as Object or string; prefer r.id if present
        let id: string | null = null;
        if (r.id && typeof r.id === 'string') id = r.id;
        else if (r._id && typeof r._id === 'string') id = r._id;
        else if (r._id && typeof r._id === 'object' && r._id.toString) {
          // e.g. mongoose ObjectId
          try {
            id = String(r._id);
          } catch {
            id = null;
          }
        }

        // format date into ISO yyyy-mm-dd for readability (if possible)
        let dateStr: string | null = null;
        if (r.date) {
          try {
            const d = new Date(r.date);
            if (Number.isFinite(d.getTime()))
              dateStr = d.toISOString().slice(0, 10);
          } catch {}
        } else if (r.createdAt) {
          try {
            const d = new Date(r.createdAt);
            if (Number.isFinite(d.getTime()))
              dateStr = d.toISOString().slice(0, 10);
          } catch {}
        }

        return {
          ...r,
          id,
          date: dateStr,
        } as ReportRow;
      });

      setReports(list);
    } catch (err: any) {
      console.error('loadReports', err);
      setError(err?.message ?? 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id?: string | null) {
    if (!id) {
      alert('Report id missing — cannot delete. Check the server response.');
      return;
    }
    if (!confirm('Delete this report permanently? This cannot be undone.'))
      return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Delete failed ${res.status}`);
      }
      // remove from local list
      setReports((r) => r.filter((x) => x.id !== id));
    } catch (err: any) {
      console.error('delete', err);
      alert('Delete failed: ' + (err?.message ?? 'unknown'));
    } finally {
      setDeleting(null);
    }
  }

  function handleEdit(id?: string | null) {
    if (!id) {
      alert('Report id missing — cannot edit. Check the server response.');
      return;
    }
    // use router.push to guarantee client-side navigation
    router.push(`/admin/edit/${encodeURIComponent(id)}`);
  }

  if (checking) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <div className="text-sm text-slate-500">Checking admin session…</div>
      </main>
    );
  }
  if (!authenticated) return null; // redirect in progress

  return (
    <>
      <Head>
        <title>Admin — Reports</title>
      </Head>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin — Reports</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage, edit and delete reports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/new-report"
              className="rounded bg-indigo-600 px-3 py-2 text-white"
            >
              New report
            </Link>
            <Link href="/api/auth/logout" className="rounded border px-3 py-2">
              Logout
            </Link>
          </div>
        </header>

        <section className="mb-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Total: {reports.length}
            </div>
            <div>
              <button
                onClick={loadReports}
                className="rounded border px-3 py-1 text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading reports…</div>
        ) : error ? (
          <div className="p-4 rounded bg-rose-50 text-rose-700">{error}</div>
        ) : reports.length === 0 ? (
          <div className="p-6 rounded border text-slate-600">
            No reports found.
          </div>
        ) : (
          <div className="grid gap-3">
            {reports.map((r) => {
              const id = r.id ?? r._id ?? null;
              const key =
                id ?? `missing-${Math.random().toString(36).slice(2, 9)}`;

              return (
                <div
                  key={key}
                  className="flex items-center gap-4 rounded border p-3 bg-white"
                >
                  <div className="w-28 h-20 flex-shrink-0 rounded overflow-hidden bg-slate-100">
                    {r.thumbnail ? (
                      <Image
                        src={r.thumbnail}
                        alt={String(r.title ?? 'thumbnail')}
                        width={280}
                        height={160}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {r.title ?? '—'}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {r.date ?? '—'} · {r.type ?? '—'} ·{' '}
                          {r.operator ?? '—'}
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        <div>F:{r.fatalities ?? '—'}</div>
                        <div>I:{r.injuries ?? '—'}</div>
                        <div>S:{r.survivors ?? '—'}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {/* Edit - use router.push via handleEdit for consistency */}
                      <button
                        onClick={() => handleEdit(id)}
                        disabled={!id}
                        title={!id ? 'Missing id — cannot edit' : 'Edit report'}
                        className={`text-sm rounded border px-3 py-1 ${!id ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(id)}
                        disabled={!id || deleting === id}
                        title={
                          !id ? 'Missing id — cannot delete' : 'Delete report'
                        }
                        className="text-sm rounded border px-3 py-1 text-rose-600 disabled:opacity-60"
                      >
                        {deleting === id ? 'Deleting…' : 'Delete'}
                      </button>

                      {/* View */}
                      <button
                        onClick={() => {
                          if (!id) {
                            alert(
                              'Report id missing — cannot view. Check the server response.'
                            );
                            return;
                          }
                          router.push(`/reports/${encodeURIComponent(id)}`);
                        }}
                        className="text-sm rounded border px-3 py-1"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
