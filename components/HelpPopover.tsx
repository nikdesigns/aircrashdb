// components/HelpPopover.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Tooltip from '@/components/Tooltip';

export default function HelpPopover() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click or Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === '?') setOpen((s) => !s);
    }
    function onClick(e: MouseEvent) {
      if (!open) return;
      if (panelRef.current && panelRef.current.contains(e.target as Node))
        return;
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <div className="relative inline-block">
      <Tooltip text="Keyboard help (press ? to toggle)">
        <button
          ref={btnRef}
          onClick={() => setOpen((s) => !s)}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="rounded px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200"
        >
          ?
        </button>
      </Tooltip>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          className="absolute right-0 mt-2 w-72 rounded bg-white p-3 text-sm text-slate-700 shadow-lg border"
        >
          <div className="font-semibold mb-2">Keyboard & Help</div>
          <ul className="space-y-1 list-inside">
            <li>
              <strong>?</strong> — Toggle this help
            </li>
            <li>
              <strong>/</strong> — Focus search (not implemented automatically)
            </li>
            <li>
              <strong>Esc</strong> — Close popovers/tooltips
            </li>
            <li>Hover or focus fields to see details</li>
          </ul>
        </div>
      )}
    </div>
  );
}
