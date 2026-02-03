'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Wallet } from 'lucide-react';

export default function AdminButton() {
  const pathname = usePathname();
  const { isAdmin, isAuthenticated } = useAuth();

  // Don't show on cabinet or admin pages
  if (pathname === '/cabinet' || pathname === '/admin') {
    return null;
  }

  return (
    <>
      {/* Cabinet Button - visible only for admins */}
      {isAdmin() && (
        <Link
          href="/cabinet"
          className="fixed left-20 bottom-4 z-[100] flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-full shadow-lg transform hover:scale-110 transition-all duration-300 ease-out"
          aria-label="My Cabinet"
        >
          <Wallet className="w-5 h-5" />
        </Link>
      )}
      
      {/* Admin Panel Button - visible only for admins, shifted to the left */}
      {isAdmin() && (
        <Link
          href="/admin"
          className="fixed left-4 bottom-4 z-[100] flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-full shadow-lg transform hover:scale-110 transition-all duration-300 ease-out"
          aria-label="Admin Panel"
        >
          <Settings className="w-5 h-5" />
        </Link>
      )}
    </>
  );
}