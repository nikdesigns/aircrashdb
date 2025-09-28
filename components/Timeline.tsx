// components/Timeline.tsx
import React from 'react';

export default function Timeline({
  items,
}: {
  items: { time?: string; title: string; detail?: string }[] | undefined;
}) {
  if (!items || items.length === 0) return null;

  return (
    <section className="rounded border p-4 bg-white">
      <h3 className="text-lg font-semibold mb-3">Timeline</h3>
      <ol className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="flex gap-4">
            <div className="w-24 text-xs text-slate-500">{it.time ?? '-'}</div>
            <div className="flex-1">
              <div className="font-medium text-slate-800">{it.title}</div>
              {it.detail && (
                <div className="text-sm text-slate-600 mt-1">{it.detail}</div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
