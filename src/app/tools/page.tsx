'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ToolsSections from '@/components/ToolsSections';
import { toolsData } from '@/data/toolsData';
import Footer from '@/components/Footer';
import AccessControl from '@/components/AccessControl';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ToolsPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isInitializing, router]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AccessControl requiredLevel={2}>
      <div className="min-h-screen bg-black flex flex-col relative">
        <div 
          className="fixed inset-0 bg-repeat bg-fixed bg-center pointer-events-none z-0"
          style={{ 
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15)), url(/img/lesson-bg.svg)',
            backgroundSize: '250% auto',
            filter: 'brightness(1.4) contrast(1.1)',
            opacity: 0.5
          }}
        />
        <div className="flex-grow relative z-10">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-green-500 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Tools</h1>
              <p className="text-gray-400">Essential services for traffic arbitrage and affiliate marketing</p>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="text-yellow-400 text-lg font-bold">⚠️</div>
                <div>
                  <h3 className="text-yellow-400 font-semibold mb-2">Disclaimer!</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    We recommend services that we've personally used at different times, and from our experience, we haven't had any issues with them. The affiliate marketing market is pretty dynamic, so some services may change their policies and offerings. It's always a good idea to confirm everything with support before making a purchase.
                  </p>
                </div>
              </div>
            </div>

            <ToolsSections tools={toolsData} />
          </div>
        </div>
        <Footer />
      </div>
    </AccessControl>
  );
}
