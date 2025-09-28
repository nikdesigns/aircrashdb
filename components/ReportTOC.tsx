// components/ReportTOC.tsx
import React, { useEffect, useState } from 'react';

export default function ReportTOC({
  rootId = 'report-content',
}: {
  rootId?: string;
}) {
  const [headings, setHeadings] = useState<
    { id: string; text: string; level: number }[]
  >([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    const hs = Array.from(root.querySelectorAll('h2, h3, h4')) as HTMLElement[];
    const list = hs.map((h) => {
      let id =
        h.id ||
        h.textContent
          ?.trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]/g, '') ||
        '';
      if (!h.id) h.id = id;
      return { id, text: h.textContent || '', level: Number(h.tagName[1]) };
    });
    setHeadings(list);

    const obs = new IntersectionObserver(
      (ents) => {
        const visible = ents
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { root: null, rootMargin: '0px 0px -70% 0px' }
    );

    hs.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [rootId]);

  if (!headings || headings.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="rounded border p-3 bg-slate-50 sticky top-24"
    >
      <div className="text-xs text-slate-500 mb-2">On this page</div>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block text-sm ${
                active === h.id
                  ? 'font-semibold text-slate-800'
                  : 'text-slate-600'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
