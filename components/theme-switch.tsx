// components/theme-switch.tsx
'use client';

import { useEffect, useState } from 'react';

export default function ThemeSwitch() {
  const [isCompact, setIsCompact] = useState<boolean>(true);

  useEffect(() => {
    const has = document.documentElement.classList.contains('compact');
    setIsCompact(has);
  }, []);

  function toggleCompact() {
    const root = document.documentElement;
    if (root.classList.contains('compact')) {
      root.classList.remove('compact');
      setIsCompact(false);
    } else {
      root.classList.add('compact');
      setIsCompact(true);
    }
  }

  return (
    <button
      onClick={toggleCompact}
      aria-pressed={isCompact}
      className="rounded px-2 py-1 text-sm bg-default-100"
      title={
        isCompact
          ? 'Compact mode: ON — click to disable'
          : 'Compact mode: OFF — click to enable'
      }
    >
      {isCompact ? 'Compact' : 'Cozy'}
    </button>
  );
}
