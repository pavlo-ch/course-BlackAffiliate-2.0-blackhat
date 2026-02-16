'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Wallet, ShoppingBag } from 'lucide-react';

export default function AdminButton() {
  const pathname = usePathname();
  const { isAdmin, isAuthenticated } = useAuth();

  const isCabinetPage = pathname?.startsWith('/cabinet');
  const isAdminPage = pathname?.startsWith('/admin');
  const isShopPage = pathname?.startsWith('/shop');
  const userIsAdmin = isAdmin();

  // If not authenticated, show nothing
  if (!isAuthenticated) return null;

  return (
    <>
      {/* Admin Panel Button - visible only for admins, leftmost */}
      {userIsAdmin && !isAdminPage && (
        <Link
          href="/admin"
          className="fixed left-4 bottom-4 z-[100] flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-full shadow-lg transform hover:scale-110 transition-all duration-300 ease-out"
          aria-label="Admin Panel"
        >
          <Settings className="w-5 h-5" />
        </Link>
      )}

      {/* Cabinet Button - visible for all, hidden on cabinet page */}
      {!isCabinetPage && (
        <Link
          href="/cabinet"
          className={`fixed bottom-4 z-[100] flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-full shadow-lg transform hover:scale-110 transition-all duration-300 ease-out ${
            userIsAdmin && !isAdminPage ? 'left-20' : 'left-4'
          }`}
          aria-label="My Cabinet"
        >
          <Wallet className="w-5 h-5" />
        </Link>
      )}

      {/* Shop Button - visible for all, hidden on shop page */}
      {!isShopPage && (
        <Link
          href="/shop"
          className={`fixed bottom-4 z-[100] flex items-center gap-2 px-6 h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-full shadow-lg transform hover:scale-110 transition-all duration-300 ease-out ${
            userIsAdmin && !isAdminPage ? 'left-36' : 'left-20'
          }`}
          aria-label="Shop"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-sm font-black uppercase tracking-wider">Shop</span>
        </Link>
      )}
    </>
  );
}