// components/RelatedReports.tsx
import useSWR from 'swr';
import Link from 'next/link';
import React from 'react';

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function RelatedReports({
  operator,
  tags,
  currentId,
}: {
  operator?: string | null;
  tags?: string[] | null;
  currentId?: string;
}) {
  const q = operator
    ? `operator=${encodeURIComponent(operator)}`
    : tags && tags.length
      ? `tags=${encodeURIComponent(tags[0])}`
      : '';
  const { data } = useSWR(q ? `/api/reports?limit=6&${q}` : null, fetcher);

  const reports =
    data?.reports?.filter((r: any) => String(r.id) !== String(currentId)) || [];
  if (!reports.length) return null;

  return (
    <div className="rounded border p-3 bg-white">
      <h4 className="text-sm font-semibold mb-2">Related reports</h4>
      <ul className="space-y-2">
        {reports.map((r: any) => (
          <li key={r.id}>
            <Link
              href={`/reports/${r.slug ?? r.id}`}
              className="text-sm text-slate-700 hover:underline"
            >
              {r.title}
            </Link>
            <div className="text-xs text-slate-400">
              {r.date ? new Date(r.date).toLocaleDateString() : ''}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
