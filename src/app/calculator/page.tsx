'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Footer from '@/components/Footer';
import AccessControl from '@/components/AccessControl';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import FacebookAdsCalculator from '@/components/FacebookAdsCalculator';

export default function CalculatorPage() {
  const { isAuthenticated, isInitializing, user } = useAuth();
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

  const calculatorContent = (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-green-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">iGaming Facebook Ads Calculator</h1>
            <p className="text-gray-400">Calculate key metrics for your Facebook advertising campaigns</p>
          </div>

          <FacebookAdsCalculator />
        </div>
      </div>
      <Footer />
    </div>
  );

  if (user?.access_level === 6) {
    return calculatorContent;
  }

  return (
    <AccessControl requiredLevel={1}>
      {calculatorContent}
    </AccessControl>
  );
}

