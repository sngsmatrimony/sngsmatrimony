'use client';

import Header from '@/components/layout/Header';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <Header showLogout={false} />
      <div className="flex items-center justify-center bg-gradient-warm-subtle p-4 min-h-[calc(100vh-80px)]">
        {children}
      </div>
    </div>
  );
}
