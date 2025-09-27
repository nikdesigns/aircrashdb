// components/Layout.tsx
'use client';

import React from 'react';
import NavBar from './NavBar'; // your existing NavBar (no change)
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <NavBar />

      {/* Page container */}
      <div className="site-container" style={{ paddingTop: 12 }}>
        {/* Use the grid defined in globals.css */}
        <div className="layout-grid">
          {/* LEFT: Sidebar */}
          <aside>
            <div
              className="card-compact"
              style={{ position: 'sticky', top: 72 }}
            >
              <div className="text-sm font-semibold">Filters</div>
              <div className="subtle-divider" />
              {/* keep your side navigation and filters here */}
              <nav className="mt-2">
                <Link
                  href="/reports"
                  className="block text-xs text-slate-600 py-1 hover:underline"
                >
                  All reports
                </Link>
                <Link
                  href="/donate"
                  className="block text-xs text-slate-600 py-1 hover:underline mt-1"
                >
                  Donate
                </Link>
                <Link
                  href="/about"
                  className="block text-xs text-slate-600 py-1 hover:underline mt-1"
                >
                  About
                </Link>
              </nav>
            </div>

            {/* If you had a supporters list, it's removed by your request */}
          </aside>

          {/* RIGHT: Main content */}
          <main>
            <div style={{ marginBottom: 12 }}>
              {/* optional page-level banner */}
            </div>
            <div>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
