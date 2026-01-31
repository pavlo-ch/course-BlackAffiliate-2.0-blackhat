'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BalanceCard } from '@/components/cabinet/BalanceCard';
import { TopUpTabs } from '@/components/cabinet/TopUpTabs';
import { getUserBalance, getActiveWallets, UserBalance, CryptoWallet } from '@/lib/cabinet';
import { useRouter } from 'next/navigation';

export default function CabinetPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
      return;
    }

    if (user) {
      const fetchData = async () => {
        try {
          const [balanceData, walletsData] = await Promise.all([
            getUserBalance(user.id),
            getActiveWallets()
          ]);
          setBalance(balanceData);
          setWallets(walletsData);
        } catch (error) {
          console.error('Failed to load cabinet data:', error);
        } finally {
          setIsDataLoading(false);
        }
      };

      fetchData();
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading || isDataLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) return null;

  return ( // Added mt-24 to offset fixed header
    <div className="min-h-screen bg-black text-white pt-32 px-4 pb-20"> 
      <div className="max-w-4xl mx-auto space-y-8">
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
