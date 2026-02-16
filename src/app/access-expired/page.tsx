'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Clock, Send, ShoppingBag, Wallet } from 'lucide-react';
import Link from 'next/link';

export default function AccessExpiredPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#222] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Access Expired</h1>
        
        <p className="text-gray-400 mb-8 leading-relaxed">
          {user?.expired_message || "Your access period has expired. Please renew your subscription to continue using the platform."}
        </p>

        <div className="space-y-3">
          <Link 
            href="/shop"
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all transform hover:scale-[1.02] shadow-lg shadow-red-900/20"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Renew Subscription</span>
          </Link>

          <a 
            href={process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN ? `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID}` : "https://t.me/nayborovskiy"}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#1A1A1A] hover:bg-[#252525] text-white rounded-xl font-medium transition-colors border border-[#333]"
          >
            <Send className="w-4 h-4" />
            <span>Contact Support</span>
          </a>
          
          <button 
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-300 text-sm mt-4 transition-colors underline"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
