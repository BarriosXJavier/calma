'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          calma
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/bookings"
            className="text-sm font-medium hover:text-primary"
          >
            Bookings
          </Link>
          <Link
            href="/meeting-types"
            className="text-sm font-medium hover:text-primary"
          >
            Meeting Types
          </Link>
          <Link
            href="/availability"
            className="text-sm font-medium hover:text-primary"
          >
            Availability
          </Link>
          <Link
            href="/settings"
            className="text-sm font-medium hover:text-primary"
          >
            Settings
          </Link>
          <UserButton afterSignOutUrl="/" />
        </nav>
      </div>
    </header>
  );
}
