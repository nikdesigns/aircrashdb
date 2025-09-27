// components/Layout.tsx
'use client';

import NavBar from './NavBar';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="mx-auto max-w-[1400px] px-6 pt-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[var(--sidebar-w)_1fr]">
          <Sidebar />

          <main className="min-h-[60vh]">
            <div className="bg-white rounded-md p-6 shadow-sm">
              <div className="article-content">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
