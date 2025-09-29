// components/Timeline.tsx
import React from 'react';

export type TimelineItem = {
  time?: string;
  title: string;
  detail?: string;
};

export default function Timeline({
  items = [],
  compact = false,
  className = '',
}: {
  items?: TimelineItem[];
  compact?: boolean;
  className?: string;
}) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={`flow-root ${className}`}>
      <ol className={`-mb-8`}>
        {items.map((it, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="relative pb-8">
              {/* vertical line */}
              {!isLast && (
                <span
                  className="absolute left-4 top-5 -ml-px h-full w-0.5 bg-slate-200"
                  aria-hidden="true"
                />
              )}

              <div className="relative flex items-start gap-4">
                {/* bullet */}
                <div className="flex flex-col items-center">
                  <div className="relative z-10">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-rose-600" />
                    </span>
                  </div>

                  {/* connector (for small screens & last element) */}
                  {!isLast && <div className="flex-1" />}
                </div>

                {/* content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    {it.time && (
                      <div className="text-xs text-slate-400 w-28 shrink-0">
                        {it.time}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-800">
                        {it.title}
                      </div>
                      {it.detail && (
                        <div
                          className={`mt-1 text-sm text-slate-600 ${compact ? 'line-clamp-3' : ''}`}
                        >
                          {/** If detail contains HTML, caller should render it. This component expects plain text. */}
                          {it.detail}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
