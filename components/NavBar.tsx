// components/NavBar.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useRouter } from 'next/router';

import { siteConfig } from '@/config/site';
import SearchBox, { SearchBoxHandle } from '@/components/SearchBox';

export default function NavBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Search state + ref
  const [q, setQ] = useState('');
  const searchRef = useRef<SearchBoxHandle | null>(null);

  // outside click & Esc to close panel
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!open) return;
      if (panelRef.current && btnRef.current) {
        if (panelRef.current.contains(e.target as Node)) return;
        if (btnRef.current.contains(e.target as Node)) return;
      }
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('touchstart', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // focus first element in panel when opened
  useEffect(() => {
    if (!open) return;
    const first =
      panelRef.current?.querySelector<HTMLElement>('a,button,input');
    first?.focus();
  }, [open]);

  // Global '/' focuses navbar search (skip when typing in inputs)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const active = document.activeElement;
        const tag = active?.tagName?.toLowerCase();
        const isEditable =
          (active as HTMLElement | null)?.getAttribute?.('contenteditable') ===
          'true';
        if (tag !== 'input' && tag !== 'textarea' && !isEditable) {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // navigate to /search?q=... when search is submitted
  function goToSearch(value: string) {
    const next = (value || '').trim();
    router.push({
      pathname: '/search',
      query: next ? { q: next } : {},
    } as any);
  }

  // handle submit from SearchBox
  function handleMainSubmit(val: string) {
    goToSearch(val);
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex items-center justify-between gap-3 py-2">
          {/* LEFT: Logo + Hamburger */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <svg
                className="h-6 w-6 text-slate-800"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <span className="font-semibold text-sm">AirCrashDB</span>
            </Link>

            {/* Hamburger adjacent to logo */}
            <div className="relative">
              <button
                ref={btnRef}
                onClick={() => setOpen((s) => !s)}
                aria-expanded={open}
                aria-controls="nav-panel"
                className="ml-1 inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
                title="Menu"
              >
                <span className="sr-only">Open menu</span>
                <svg
                  className="h-5 w-5 text-slate-700"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Dropdown panel anchored to left of hamburger */}
              <div
                id="nav-panel"
                ref={panelRef}
                role="menu"
                aria-hidden={!open}
                className={clsx(
                  'origin-top-left absolute left-0 mt-2 w-[320px] sm:w-[380px] bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5',
                  open ? 'block' : 'hidden'
                )}
                style={{ zIndex: 60 }}
              >
                <div className="p-3">
                  {/* small (mobile) search inside panel */}
                  <div className="mb-2 md:hidden">
                    {/* Mobile: simple input that navigates on Enter */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const val = (
                          e.currentTarget.querySelector(
                            'input[name="q_panel"]'
                          ) as HTMLInputElement
                        )?.value;
                        goToSearch(val || '');
                        setOpen(false);
                      }}
                    >
                      <input
                        name="q_panel"
                        type="search"
                        placeholder="Search reports..."
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                      />
                    </form>
                  </div>

                  <nav
                    className="flex flex-col gap-1"
                    aria-label="Main navigation"
                  >
                    {siteConfig.navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>

                  <div className="mt-3 border-t pt-3">
                    <div className="text-xs font-semibold text-slate-500 mb-2">
                      More
                    </div>
                    <div className="flex flex-col gap-1">
                      {siteConfig.navMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                          role="menuitem"
                          onClick={() => setOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 border-t pt-3 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Support the project
                    </div>
                    <Link
                      href="/donate" // <- changed to internal donate page
                      className="inline-flex items-center gap-2 rounded-md bg-red-50 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
                      onClick={() => setOpen(false)}
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M12 21s-7-4.35-9.5-7.1C-1.1 9.6 4.2 2 12 7c7.8-5 13.1 2.6 9.5 6.9C19 16.65 12 21 12 21z" />
                      </svg>
                      Donate
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: Search (md+) */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <div className="w-full max-w-[520px]">
              {/* <<< Remove outer <form> — SearchBox handles its own form to avoid nested forms/hydration mismatch >>> */}
              <SearchBox
                ref={searchRef}
                value={q}
                onChange={setQ}
                onSubmit={(val) => {
                  handleMainSubmit(val);
                }}
                placeholder="Search reports..."
              />
            </div>
          </div>

          {/* RIGHT: Donate button */}
          <Link
            href="/donate" // <- changed to internal donate page
            className="inline-flex items-center gap-2 rounded-md border border-transparent bg-red-50 px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 21s-7-4.35-9.5-7.1C-1.1 9.6 4.2 2 12 7c7.8-5 13.1 2.6 9.5 6.9C19 16.65 12 21 12 21z" />
            </svg>
            <span className="hidden sm:inline">Donate</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
