'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Check, Rocket, PartyPopper, Trophy } from 'lucide-react';

const CHECKLIST_STORAGE_KEY = 'ba-launch-checklist';

const CHECKLIST_ITEMS = [
  { id: 'network', text: 'Choosing an Affiliate Network/Operator' },
  { id: 'consultation', text: 'Consultation with the Affiliate Manager regarding the offer and Geo' },
  { id: 'audience', text: 'Audience research, market, Geo' },
  { id: 'spy-analysis', text: 'Analysis of top games and approaches via Spy service in the desired Geo' },
  { id: 'casino-analysis', text: 'Analysis of casino offerings and review of the best games' },
  { id: 'notations', text: 'Notations, all information in doc/miro' },
  { id: 'funnel', text: 'Funnel planning, concepts' },
  { id: 'creative-brief', text: 'Writing the creative brief and concept for 5 to 10 ad creatives' },
  { id: 'creative-production', text: 'Producing the ad creatives' },
  { id: 'fb-accounts', text: 'Buying FB accounts or renting agency accounts' },
  { id: 'antidetect', text: 'Setting up browser anti-detection and proxy' },
  { id: 'fb-login', text: 'Checking FB accounts, logging in' },
  { id: 'fan-page', text: 'Preparing 1–3 Fan Pages (recommended for a specific game or casino brand)' },
  { id: 'instagram', text: 'Buying an Instagram account and setting it up to match your current Fan Page' },
  { id: 'instagram-meta', text: 'Connect your Instagram account to Meta Business Suite (with the required Fan Page)' },
  { id: 'pixel-capi', text: 'Setting up Facebook Pixel CAPI' },
  { id: 'tracker-setup', text: 'Basic tracker setup, overview' },
  { id: 'postback-network', text: 'Setting up Postback for a tracker with affiliate networks/operators' },
  { id: 'postback-pwa', text: 'Setting up Postback for a tracker with Traffic Source (PWA)' },
  { id: 'tracker-offers', text: 'Adding 1–2 offers to the tracker' },
  { id: 'tracker-domain', text: 'Adding a domain to the tracker' },
  { id: 'tracker-campaign', text: 'Setting up a tracking campaign (split test offers)' },
  { id: 'pixel-pwa', text: 'Adding pixel/token to PWA' },
  { id: 'pwa-designs', text: 'Preparation of 1–3 designs, copyright (description + comments) for PWA' },
  { id: 'pwa-setup', text: 'Setup of 1–3 PWA apps for the selected game/approach' },
  { id: 'push-notifications', text: 'Push notification settings' },
  { id: 'pwa-split', text: 'Setting up 2–3 PWA split test' },
  { id: 'pwa-testing', text: 'PWA testing (install and registration checks)' },
  { id: 'metrics-columns', text: 'Organizing work columns with metrics' },
  { id: 'ad-campaigns', text: 'Setting up ad campaigns' },
  { id: 'final-check', text: 'Final check before launch' },
  { id: 'launch', text: 'Launching traffic' },
];

export default function ChecklistPage() {
  const { isAuthenticated, isInitializing, accessToken } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isInitializing, router]);

  // Initial load: Try localStorage first for instant UI, then fetch from API
  useEffect(() => {
    let mounted = true;

    const loadChecklist = async () => {
      // 1. Instantly load from localStorage if available
      try {
        const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
        if (saved && mounted) {
          setChecked(new Set(JSON.parse(saved)));
        }
      } catch {}

      // 2. Fetch fresh data from API
      try {
        if (!accessToken) return;

        const res = await fetch('/api/checklist', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        const data = await res.json();
        if (data.success && Array.isArray(data.items) && mounted) {
          const fetchedSet = new Set<string>(data.items);
          setChecked(fetchedSet);
          // Update localStorage with fresh data
          localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(data.items));
        }
      } catch (error) {
        console.error('Failed to load checklist from API:', error);
      }
    };

    if (isAuthenticated && !isInitializing && accessToken) {
      loadChecklist();
    }

    return () => { mounted = false; };
  }, [isAuthenticated, isInitializing, accessToken]);

  // Show celebration when all items are checked
  useEffect(() => {
    if (checked.size === CHECKLIST_ITEMS.length && checked.size > 0) {
      setShowCelebration(true);
    }
  }, [checked]);

  const saveToApi = async (newItems: string[]) => {
    try {
      if (!accessToken) return;

      await fetch('/api/checklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ items: newItems })
      });
    } catch (error) {
      console.error('Failed to save checklist to API:', error);
    }
  };

  const toggleItem = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      
      const newArray = Array.from(next);
      // Optimistic save to localStorage
      try { localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(newArray)); } catch {}
      // Async save to API
      saveToApi(newArray);
      
      return next;
    });
  };

  const completedCount = checked.size;
  const totalCount = CHECKLIST_ITEMS.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Celebration modal
  if (showCelebration) {
    return (
      <div className="min-h-screen bg-black relative flex items-center justify-center">
        <div
          className="fixed inset-0 bg-repeat bg-fixed bg-center pointer-events-none z-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15)), url(/img/lesson-bg.svg)',
            backgroundSize: '250% auto',
            filter: 'brightness(1.4) contrast(1.1)',
            opacity: 0.5,
          }}
        />
        <div className="relative z-10 max-w-lg mx-auto px-4 text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center animate-bounce shadow-2xl shadow-yellow-500/30">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-4 animate-pulse">
              <PartyPopper className="w-10 h-10 text-yellow-400" />
            </div>
            <div className="absolute -top-2 -left-4 animate-pulse" style={{ animationDelay: '0.3s' }}>
              <PartyPopper className="w-10 h-10 text-yellow-400 -scale-x-100" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-3">
            Congratulations! 🎉
          </h1>
          <p className="text-xl text-yellow-400 font-semibold mb-4">
            All {totalCount} steps completed!
          </p>
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            You have completed the full launch checklist. You are now ready to start driving traffic and making profit. Good luck! 🚀
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowCelebration(false)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-yellow-500/25 transition-all duration-300"
            >
              <Rocket className="w-4 h-4" />
              View Checklist
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      <div
        className="fixed inset-0 bg-repeat bg-fixed bg-center pointer-events-none z-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15)), url(/img/lesson-bg.svg)',
          backgroundSize: '250% auto',
          filter: 'brightness(1.4) contrast(1.1)',
          opacity: 0.5,
        }}
      />
      <div className="relative z-10">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
          {/* Back button */}
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Launch Checklist</h1>
              <p className="text-gray-400 text-sm">Track your progress from setup to launch</p>
            </div>
          </div>
        </div>

        {/* Sticky progress bar */}
        <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-sm border-b border-gray-800/50">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-gray-400 text-sm">Progress</span>
              <span className="text-white font-semibold text-sm">{completedCount} / {totalCount} — {Math.round(progress)}% complete</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  background: progress === 100
                    ? 'linear-gradient(to right, #22c55e, #10b981)'
                    : 'linear-gradient(to right, #ef4444, #f97316)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="max-w-3xl mx-auto px-4 py-4 pb-8">
          <div className="bg-gradient-to-b from-[#1a1d22] to-[#0f1012] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="divide-y divide-gray-800/50">
              {CHECKLIST_ITEMS.map((item, index) => {
                const isChecked = checked.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 cursor-pointer transition-all duration-200 group ${
                      isChecked
                        ? 'bg-green-500/5 hover:bg-green-500/10'
                        : 'hover:bg-gray-800/30'
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    {/* Number */}
                    <span className={`text-xs font-mono w-6 text-right flex-shrink-0 ${
                      isChecked ? 'text-green-500/50' : 'text-gray-600'
                    }`}>
                      {index + 1}.
                    </span>

                    {/* Checkbox */}
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      isChecked
                        ? 'border-green-500 bg-green-500 shadow-sm shadow-green-500/30'
                        : 'border-gray-600 group-hover:border-gray-400'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>

                    {/* Text */}
                    <span className={`text-sm sm:text-base transition-all duration-200 ${
                      isChecked
                        ? 'text-gray-500 line-through'
                        : 'text-gray-200 group-hover:text-white'
                    }`}>
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-4 border-t border-gray-800">
              <span className="text-gray-500 text-xs">
                {completedCount === 0 ? 'Click items to mark as complete' : `${Math.round(progress)}% complete`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
