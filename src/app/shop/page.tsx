'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Check, X } from 'lucide-react';
import { getUserBalance, UserBalance } from '@/lib/cabinet';

interface ShopService {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  type: string;
  duration_days: number;
}

export default function ShopPage() {
  const { user, isAuthenticated, isLoading, accessToken } = useAuth();
  const router = useRouter();
  
  const [services, setServices] = useState<ShopService[]>([]);
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Purchase Modal State
  const [selectedService, setSelectedService] = useState<ShopService | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'success' | 'error' | 'insufficient_funds'>('idle');
  const [purchaseMessage, setPurchaseMessage] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        const [servicesRes, balanceData] = await Promise.all([
          fetch('/api/shop/services'),
          getUserBalance(user.id)
        ]);

        const servicesData = await servicesRes.json();
        
        if (servicesData.success) {
          setServices(servicesData.services);
        }
        
        setBalance(balanceData);
      } catch (error) {
        console.error('Failed to load shop data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const handlePurchase = async () => {
    if (!selectedService || !user) return;
    
    setIsPurchasing(true);
    setPurchaseStatus('idle');
    setPurchaseMessage('');
    
    try {
      const response = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ serviceId: selectedService.id })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setPurchaseStatus('success');
        setPurchaseMessage('Purchase successful! Your access has been extended.');
        // Refresh balance
        const newBalance = await getUserBalance(user.id);
        setBalance(newBalance);
      } else {
        if (data.message === 'Insufficient funds') {
          setPurchaseStatus('insufficient_funds');
        } else {
          setPurchaseStatus('error');
        }
        setPurchaseMessage(data.message || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setPurchaseStatus('error');
      setPurchaseMessage('Network error. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };


  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <p className="mt-4 text-gray-400">Loading Shop...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-10 px-4 pb-20">
      <div className="max-w-6xl mx-auto space-y-8 mt-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-blue-500" />
              Service Shop
            </h1>
            <p className="text-gray-400">Purchase services and extend your subscription.</p>
          </div>
          
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-medium">Your Balance</p>
              <p className="text-xl font-bold text-white">
                {(balance?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                <span className="text-sm font-normal text-gray-400 ml-1">{balance?.currency || 'USD'}</span>
              </p>
            </div>
            <Link 
              href="/cabinet" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Top Up
            </Link>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div 
              key={service.id}
              className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden hover:border-gray-700 transition-all flex flex-col group"
            >
              <div className="p-6 flex-1 flex flex-col pt-8">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {service.title}
                    </h3>
                    {service.type === 'subscription' && (
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                        Subscription
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    {service.description}
                  </p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-[#222] flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    ${service.price}
                  </div>
                  <button
                    onClick={() => setSelectedService(service)}
                    className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors active:scale-95"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Purchase Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => {
                setSelectedService(null);
                setPurchaseStatus('idle');
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {purchaseStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
                <p className="text-gray-400 mb-6">{purchaseMessage}</p>
                <button
                  onClick={() => {
                    setSelectedService(null);
                    setPurchaseStatus('idle');
                  }}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            ) : purchaseStatus === 'insufficient_funds' ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Insufficient Funds</h3>
                <p className="text-gray-400 mb-6">You don't have enough balance to purchase this service.</p>
                <div className="flex flex-col gap-3">
                    <Link
                      href="/cabinet"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors text-center shadow-lg shadow-blue-900/20"
                    >
                      Top Up Balance
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedService(null);
                        setPurchaseStatus('idle');
                      }}
                      className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                    >
                      Cancel
                    </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-1">Confirm Purchase</h3>
                <p className="text-gray-400 text-sm mb-6">You are about to purchase:</p>
                
                <div className="bg-[#111] p-4 rounded-xl border border-[#222] mb-6">
                   <div>
                     <div className="font-bold text-white">{selectedService.title}</div>
                     <div className="text-blue-400 font-bold mt-1">${selectedService.price}</div>
                   </div>
                </div>

                {purchaseStatus === 'error' && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center mb-4">
                    {purchaseMessage}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedService(null);
                      setPurchaseStatus('idle');
                    }}
                    disabled={isPurchasing}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPurchasing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {isPurchasing ? 'Processing...' : `Confirm ($${selectedService.price})`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
