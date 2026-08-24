'use client';

import { LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import HelpButton from './HelpButton';

export default function Header({ showLogout = false, isFixed = false }) {
  const { logout, user, membership, token } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const headerClasses = isFixed
    ? 'border-b border-gray-100 fixed top-0 left-0 right-0 z-50 bg-white shadow-sm'
    : 'border-b border-gray-100';

  // PROMOTIONAL: Credits and membership display commented out during promotional period
  // const userCredits = membership?.credits ?? user?.membership?.credits ?? 0;
  // const isRegularUser = user && token && user.role !== 'admin';
  // const showCredits = isRegularUser && userCredits > 0;
  // const showGetMembership = !showCredits && isRegularUser;

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
          <Image
            src="/logo.jpeg"
            alt="SNGS Matrimonial Logo"
            width={48}
            height={48}
            className="h-12 w-auto"
            style={{ width: 'auto', height: 'auto' }}
          />
          <h1 className="font-viga text-2xl text-accent">SNGS Matrimonial</h1>
        </Link>

        {/* Center section - Welcome message and credits */}
        <div className="hidden md:flex items-center gap-4">
          {user && (
            <span className="font-maven text-secondary">
              Welcome, <span className="font-semibold">{user.fullName}</span>
            </span>
          )}
          {/* PROMOTIONAL: Credits display and Get Membership button commented out during promotional period
          {showCredits && (
            <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
              <Coins size={16} className="text-primary" />
              <span className="font-telex text-sm text-secondary">
                <span className="font-semibold text-secondary">{userCredits}</span> {userCredits === 1 ? 'Credit' : 'Credits'}
              </span>
            </div>
          )}
          {showGetMembership && (
            <Link
              href="/membership/purchase"
              className="bg-primary hover:bg-primary/90 px-4 py-1.5 rounded-full font-telex text-sm font-semibold text-black transition-colors"
            >
              Get Membership
            </Link>
          )}
          */}
        </div>

        <div className="flex items-center gap-2">
          {/* PROMOTIONAL: Mobile credits and Get Membership commented out during promotional period
          {showCredits && (
            <div className="flex md:hidden items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
              <Coins size={14} className="text-primary" />
              <span className="font-telex text-xs font-semibold text-secondary">{userCredits} {userCredits === 1 ? 'Credit' : 'Credits'}</span>
            </div>
          )}
          {showGetMembership && (
            <Link
              href="/membership/purchase"
              className="flex md:hidden bg-primary hover:bg-primary/90 px-3 py-1 rounded-full font-telex text-xs font-semibold text-black transition-colors"
            >
              Get Membership
            </Link>
          )}
          */}
          <HelpButton />
          {showLogout && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-telex"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
