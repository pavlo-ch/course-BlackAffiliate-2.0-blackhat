'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export function PaymentTicker() {
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !user?.payment_reminder) return null;

  return (
    <div className="relative w-full z-[9999] bg-red-900/95 text-red-100 py-3 overflow-hidden border-b border-red-700/50 shadow-xl backdrop-blur-sm">
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: fit-content;
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="flex items-center w-full h-full overflow-hidden">
        <div className="animate-marquee font-bold text-lg tracking-wide uppercase">
          {/* Duplicate content creates seamless loop */}
          <div className="flex shrink-0 items-center">
            {[...Array(5)].map((_, i) => (
              <a 
                key={`a-${i}`} 
                href="/invoice.pdf" 
                download="invoice.pdf"
                className="flex items-center group cursor-pointer hover:text-white transition-colors"
                title="Download Invoice"
              >
                <span className="mx-6 text-red-500 group-hover:text-red-400">|</span>
                <span className="flex items-center gap-2">
                  {user.payment_reminder} 
                  <span className="text-sm opacity-80 font-normal normal-case ml-2">(Hover and click to download invoice)</span>
                  <Download className="w-4 h-4" />
                </span>
              </a>
            ))}
          </div>
          <div className="flex shrink-0 items-center">
            {[...Array(5)].map((_, i) => (
              <a 
                key={`b-${i}`} 
                href="/invoice.pdf" 
                download="invoice.pdf"
                className="flex items-center group cursor-pointer hover:text-white transition-colors"
                title="Download Invoice"
              >
                <span className="mx-6 text-red-500 group-hover:text-red-400">|</span>
                <span className="flex items-center gap-2">
                  {user.payment_reminder}
                  <span className="text-sm opacity-80 font-normal normal-case ml-2">(Hover and click to download invoice)</span>
                  <Download className="w-4 h-4" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
