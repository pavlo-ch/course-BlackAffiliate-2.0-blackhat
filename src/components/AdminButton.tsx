'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Settings } from 'lucide-react';

export default function AdminButton() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  if (!isAdmin() || pathname === '/admin') {
    return null;
  }

  return (
    <Link
      href="/admin"
      className="fixed left-4 bottom-4 z-[100] flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:shadow-blue-500/50 transform hover:scale-110 transition-all duration-300 ease-out"
      aria-label="Admin Panel"
    >
      <Settings className="w-5 h-5" />
    </Link>
  );
}