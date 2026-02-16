'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserBalance, getUserHistory, UserBalance, CryptoWallet, getActiveWallets, TransactionHistoryItem } from '@/lib/cabinet';
import { TopUpTabs } from '@/components/cabinet/TopUpTabs';
import { Wallet, History, Calendar, Clock, ShoppingBag, ArrowRight, User as UserIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BalanceCard } from '@/components/cabinet/BalanceCard';

export default function CabinetPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [history, setHistory] = useState<TransactionHistoryItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'topup' | 'history'>('topup');

  // ... (useEffect hooks match existing file)

  const refreshData = async () => {
    if (!user?.id) return;
    try {
      const [balanceData, historyData] = await Promise.all([
        getUserBalance(user.id),
        getUserHistory()
      ]);
      setUserBalance(balanceData);
      setHistory(historyData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        const [balanceData, walletsData, historyData] = await Promise.all([
          getUserBalance(user.id),
          getActiveWallets(),
          getUserHistory()
        ]);
        
        setUserBalance(balanceData);
        setWallets(walletsData);
        setHistory(historyData);
      } catch (error) {
        console.error('Error fetching cabinet data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <p className="mt-4 text-gray-400">Loading Cabinet...</p>
      </div>
    );
  }

  // Format dates
  const createdDate = user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';
  const expiryDate = user?.access_expires_at 
    ? new Date(user.access_expires_at).toLocaleDateString() 
    : 'Lifetime Access';
  
  const isExpired = user?.access_expires_at && new Date(user.access_expires_at) < new Date();

  return (
    <div className="min-h-screen bg-black text-white pt-10 px-4 pb-20">
      <div className="max-w-6xl mx-auto space-y-8 mt-12">
        
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">User Cabinet</h1>
            <p className="text-gray-400">Manage your subscription and balance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Stats & Info */}
          <div className="space-y-6">
            {/* Balance Card */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-300">
                <Wallet className="w-5 h-5 text-green-500" />
                Current Balance
              </h2>
              <div className="text-4xl font-bold text-white mb-2">
                {userBalance ? userBalance.balance.toLocaleString() : '0'} 
                <span className="text-xl text-gray-500 ml-2">{userBalance?.currency || 'USD'}</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Available for services and renewals</p>
              
              <Link 
                href="/shop" 
                className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors border border-gray-700 hover:border-gray-600"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Open Shop</span>
              </Link>
            </div>

            {/* Account Info Card */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-300">
                <UserIcon className="w-5 h-5 text-blue-500" />
                Account Status
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Registration Date</p>
                    <p className="font-medium text-white">{createdDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isExpired ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                    <Clock className={`w-5 h-5 ${isExpired ? 'text-red-500' : 'text-green-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Access Valid Until</p>
                    <p className={`font-medium ${isExpired ? 'text-red-500' : 'text-green-400'}`}>
                      {expiryDate}
                    </p>
                    {isExpired && (
                      <Link href="/shop" className="text-xs text-blue-400 hover:underline mt-1 block">
                        Renew Subscription &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden min-h-[500px]">
              {/* Tabs */}
              <div className="flex border-b border-[#222]">
                <button
                  onClick={() => setActiveTab('topup')}
                  className={`flex-1 py-4 text-center font-medium transition-colors relative ${
                    activeTab === 'topup' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Top Up Balance
                  {activeTab === 'topup' && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-4 text-center font-medium transition-colors relative ${
                    activeTab === 'history' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Transaction History
                  {activeTab === 'history' && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />
                  )}
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'topup' ? (
                  <TopUpTabs 
                    wallets={wallets} 
                    onDepositSuccess={() => {
                      refreshData();
                      // Optional: switch TAB to history? User choice.
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    {history.length > 0 ? (
                      <div className="space-y-4">
                        {history.map((item) => (
                          <div 
                            key={item.id} 
                            className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors hover:border-gray-700"
                          >
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-lg ${
                                item.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                              }`}>
                                {item.type === 'deposit' ? <Wallet className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="font-medium text-white flex items-center gap-2">
                                  {item.type === 'deposit' ? 'Balance Deposit' : (item.service?.title || 'Purchase')}
                                  {item.type === 'deposit' && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                      item.status === 'confirmed' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                      item.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                      'bg-red-500/10 border-red-500/20 text-red-400'
                                    }`}>
                                      {item.status}
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {new Date(item.created_at).toLocaleString()}
                                </p>
                                {item.transaction_hash && (
                                  <p className="text-xs text-gray-600 mt-1 font-mono break-all">
                                    Hash: {item.transaction_hash.slice(0, 10)}...
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className={`text-xl font-bold ${
                              item.type === 'deposit' ? 'text-green-500' : 'text-white'
                            }`}>
                              {item.type === 'deposit' ? '+' : '-'}${item.amount}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 text-gray-500">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No transactions found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
