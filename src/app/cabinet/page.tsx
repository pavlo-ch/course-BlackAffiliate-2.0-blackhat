'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BalanceCard } from '@/components/cabinet/BalanceCard';
import { TopUpTabs } from '@/components/cabinet/TopUpTabs';
import { getUserBalance, getActiveWallets, UserBalance, CryptoWallet } from '@/lib/cabinet';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CabinetPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  // Effect 1: Access Control
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Effect 2: Data Fetching with Safety
  useEffect(() => {
    let isMounted = true;
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted && isFetching) {
        console.warn('⚠️ Force stopping loading spinner after timeout');
        setIsFetching(false);
      }
    }, 5000);

    const fetchData = async () => {
      // Don't fetch if no user
      if (!user?.id) return;

      setIsFetching(true);
      try {
        const [balanceData, walletsData] = await Promise.all([
          getUserBalance(user.id),
          getActiveWallets()
        ]);
        
        if (isMounted) {
          setBalance(balanceData);
          setWallets(walletsData);
        }
      } catch (error) {
        console.error('Failed to load cabinet data:', error);
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };

    // Initial fetch
    if (user?.id) {
       fetchData();
    } else if (!isLoading && !user) {
        if (isMounted) setIsFetching(false);
    }

    // Refresh on tab focus
    const onFocus = () => {
      if (user?.id && !isFetching) {
        fetchData();
      }
    };

    window.addEventListener('focus', onFocus);
    
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.id, isLoading]); // Removed isFetching from deps to avoid loop

  // Manual refresh handler
  const handleRefresh = async () => {
    if (!user?.id) return;
    
    setIsFetching(true);
    try {
      const [balanceData, walletsData] = await Promise.all([
        getUserBalance(user.id),
        getActiveWallets()
      ]);
      setBalance(balanceData);
      setWallets(walletsData);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsFetching(false);
    }
  };

  // Show loading state ONLY active fetching AND no data yet
  const showLoading = isLoading || (isFetching && !balance);

  if (showLoading) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return ( // Added mt-24 to offset fixed header
    <div className="min-h-screen bg-black text-white pt-10 px-4 pb-20"> 
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Course
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">My Cabinet</h1>
          <p className="text-gray-400">Manage your balance and deposits.</p>
        </div>

        <BalanceCard 
          balance={balance?.balance || 0} 
          currency={balance?.currency || 'USD'} 
        />

        <div>
          <h2 className="text-xl font-bold mb-4">Top Up Balance</h2>
          <TopUpTabs wallets={wallets} />
        </div>
      </div>
    </div>
  );
}
