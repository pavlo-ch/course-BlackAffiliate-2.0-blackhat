'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AccessControl from '@/components/AccessControl';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ArrowRight, Play, FileText, HelpCircle, Map, Tag, Wrench, Settings, Calculator, Wallet, Gamepad2 } from 'lucide-react';
import { courseData } from '@/data/courseData';
import AnnouncementsButton from '@/components/AnnouncementsButton';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import AnnouncementsList from '@/components/AnnouncementsList';
import PushNotificationSettings from '@/components/PushNotificationSettings';
import CourseSearch from '@/components/CourseSearch';
import { AnnouncementWithReadStatus } from '@/types/announcements';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementWithReadStatus[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAnnouncementsList, setShowAnnouncementsList] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const locallyReadIdsRef = useRef<Set<string>>(new Set());
  const announcementsLoadedRef = useRef(false);

  const loadAnnouncements = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.warn('No auth token available for loading announcements');
        return;
      }
      
      const response = await fetch('/api/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Announcements API error:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        const serverAnnouncements: AnnouncementWithReadStatus[] = data.announcements || [];
        const merged = serverAnnouncements.map(a => 
          locallyReadIdsRef.current.has(a.id) ? { ...a, is_read: true } : a
        );
        setAnnouncements(merged);
        const realUnread = merged.filter(a => !a.is_read).length;
        setUnreadCount(realUnread);
        announcementsLoadedRef.current = true;
      } else {
        console.error('Announcements API returned error:', data.message);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const getToken = async (): Promise<string | undefined> => {
    try {
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
      ]) as any;
      if (result?.data?.session?.access_token) return result.data.session.access_token;
    } catch {}

    try {
      const result = await Promise.race([
        supabase.auth.refreshSession(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
      ]) as any;
      if (result?.data?.session?.access_token) return result.data.session.access_token;
    } catch {}

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        const projectId = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1];
        if (projectId) {
          const stored = localStorage.getItem(`sb-${projectId}-auth-token`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.access_token) return parsed.access_token;
          }
        }
      }
    } catch {}

    return undefined;
  };

  const handleMarkAsRead = useCallback((id: string) => {
    locallyReadIdsRef.current.add(id);
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    getToken().then(token => {
      if (!token) return;
      fetch(`/api/announcements/${id}/mark-read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(() => {});
    });
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    const unreadIds = announcements.filter(a => !a.is_read).map(a => a.id);
    if (unreadIds.length === 0) return;

    unreadIds.forEach(id => locallyReadIdsRef.current.add(id));
    setAnnouncements(prev => prev.map(a => ({ ...a, is_read: true })));
    setUnreadCount(0);

    getToken().then(token => {
      if (!token) return;
      Promise.all(
        unreadIds.map(id =>
          fetch(`/api/announcements/${id}/mark-read`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
          }).catch(() => {})
        )
      );
    });
  }, [announcements]);

  useEffect(() => {
    if (user && !announcementsLoadedRef.current) {
      loadAnnouncements();
    }
  }, [user]);
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black relative">
        <div 
          className="fixed inset-0 bg-repeat bg-fixed bg-center pointer-events-none z-0"
          style={{ 
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15)), url(/img/lesson-bg.svg)',
            backgroundSize: '250% auto',
            filter: 'brightness(1.4) contrast(1.1)',
            opacity: 0.5
          }}
        />
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-64 md:h-[443px] bg-[url('/img/hero.webp')] bg-cover bg-center opacity-80 border-b-4 border-black"></div>
          <div className="absolute top-64 md:top-[443px] left-0 right-0 h-8 md:h-20 lg:h-32 bg-gradient-to-b from-red-500/15 via-red-400/5 to-transparent"></div>
          <div className="absolute top-64 md:top-[443px] left-0 bottom-0 w-8 md:w-20 lg:w-32 bg-gradient-to-r from-red-500/15 via-red-400/5 to-transparent"></div>
          <div className="absolute top-64 md:top-[443px] right-0 bottom-0 w-8 md:w-20 lg:w-32 bg-gradient-to-l from-red-500/15 via-red-400/5 to-transparent"></div>
          <div className="relative z-10">
            <div className="container mx-auto px-4 py-6 md:py-12">
              <div className="text-center mb-8 md:mb-16">
                <div className="relative mb-4 md:mb-6">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white">
                    Black Affiliate
                  </h1>
                  <div className="absolute top-0 right-0 flex items-center gap-2">
                    <AnnouncementsButton
                      unreadCount={unreadCount}
                      onClick={() => setShowAnnouncementsList(true)}
                    />
                  </div>
                </div>
                <p className="text-base md:text-xl text-gray-300 max-w-3xl mx-auto mb-6 px-4">
                  Traffic arbitrage and affiliate marketing training program
                </p>
                
                {user?.access_level !== 4 && (
                  <div className="text-white mb-8 md:mb-10">
                    <span className="text-sm text-gray-300">Package: </span>
                    <span className="text-sm font-bold text-white">
                      {user?.access_level === 2 ? 'Knowledge Base' : user?.access_level === 3 ? 'Mentorship' : user?.access_level === 6 ? 'Creative Push Only' : ''}
                    </span>
                  </div>
                )}

                <div className="flex justify-center mb-6 px-4 md:px-0">
                  <CourseSearch />
                </div>
                <div className="flex flex-wrap justify-center gap-4 mb-8 md:mb-12">
                  {user?.access_level !== 4 && (
                    <AccessControl requiredLevel={3} fallback={
                      <div className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg shadow-lg cursor-not-allowed opacity-50">
                        <Map className="w-5 h-5" />
                         <span>Road Map</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    }>
                      <a 
                        href="https://miro.com/app/board/uXjVJP7Hcs8=/?embedMode=view_only_without_ui&moveToViewport=-51326,-112706,83650,46586&embedId=621168039653" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:shadow-red-500/25 transform hover:scale-105 transition-all duration-300 ease-out"
                      >
                        <Map className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                        <span>Road Map</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </a>
                    </AccessControl>
                  )}
                  
                  <AccessControl requiredLevel={1} fallback={
                    <div className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg shadow-lg cursor-not-allowed opacity-50">
                      <Tag className="w-5 h-5" />
                      <span>Offers</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  }>
                  <Link 
                    href="/offers"
                    className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:shadow-orange-500/25 transform hover:scale-105 transition-all duration-300 ease-out"
                  >
                    <Tag className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Offers</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                  </AccessControl>
                  
                  <AccessControl requiredLevel={2} fallback={
                    <div className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg shadow-lg cursor-not-allowed opacity-50">
                      <Wrench className="w-5 h-5" />
                       <span>Tools</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  }>
                    <Link 
                      href="/tools"
                      className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-300 ease-out"
                    >
                      <Wrench className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                      <span>Tools</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </AccessControl>

                  {user?.access_level === 6 ? (
                    <Link 
                      href="/calculator"
                      className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 ease-out"
                    >
                      <Calculator className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                      <span>Calculator</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  ) : (
                    <AccessControl requiredLevel={1} fallback={
                      <div className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg shadow-lg cursor-not-allowed opacity-50">
                        <Calculator className="w-5 h-5" />
                         <span>Calculator</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    }>
                      <Link 
                        href="/calculator"
                        className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 ease-out"
                      >
                        <Calculator className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                        <span>Calculator</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </AccessControl>
                  )}
                  {/* Play demo - accessible to all */}
                  <a 
                    href="https://www.advantage-agency.co/top"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 ease-out"
                  >
                    <Gamepad2 className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Play demo</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </a>
                </div>
              </div>
              
                

              <div className="grid gap-4 md:gap-6 max-w-4xl mx-auto px-4">
                {courseData.map((section, index) => {
                  const moduleNumber = index + 1;
                  const moduleImage = `/img/module-${moduleNumber}.webp`;
                  const isLevel6 = user?.access_level === 6;
                  const isModule4 = section.id === 'section-4';
                  const isDisabled = isLevel6 && !isModule4;
                  const targetLessonId = isLevel6 && isModule4 ? 'lesson-4-9' : section.lessons[0]?.id;
                  
                  const moduleContent = (
                    <div className={`sm:bg-[#0f1012] bg-gradient-to-br from-[#1a1d22] to-[#0f1012] sm:border-0 border border-gray-800/50 rounded-xl sm:rounded-lg overflow-hidden ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gradient-to-r hover:from-gray-800/90 hover:to-red-900/20 hover:shadow-lg hover:shadow-red-500/10 hover:scale-[1.02] sm:hover:scale-[1.02] hover:scale-[1.01] cursor-pointer'} transition-all duration-300 group`}>
                      <div className="flex flex-col sm:flex-row items-center">
                        <div className="w-full sm:w-32 md:w-40 h-40 sm:h-24 md:h-32 p-3 sm:p-2 md:p-4 flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-gray-900/50 to-transparent sm:bg-transparent rounded-t-xl sm:rounded-lg">
                          <img 
                            src={moduleImage} 
                            alt={`Module ${moduleNumber}`}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<span class="text-xl md:text-3xl font-bold text-white">${moduleNumber}</span>`;
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1 w-full px-4 md:px-6 py-4 sm:py-3 md:py-4 text-left sm:text-left flex items-center justify-between sm:block">
                          <div className="flex-1">
                            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-1.5 sm:mb-1">
                              Module {moduleNumber} - {section.title.replace(/^\d+\.\s*/, '')}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {section.lessons.length} lessons
                            </p>
                          </div>
                          <div className="sm:hidden ml-3">
                            <ArrowRight className={`w-5 h-5 ${isDisabled ? 'text-gray-600' : 'text-red-500'} transition-all duration-300`} />
                          </div>
                        </div>
                        <div className="hidden sm:block px-4 md:px-6 pb-3 sm:pb-0">
                          <ArrowRight className={`w-5 h-5 md:w-6 md:h-6 ${isDisabled ? 'text-gray-600' : 'text-red-500 group-hover:text-red-400 group-hover:translate-x-1'} transition-all duration-300`} />
                        </div>
                      </div>
                    </div>
                  );
                  
                  return (
                    <div key={section.id} className="group">
                      {isDisabled ? (
                        <div>
                          {moduleContent}
                        </div>
                      ) : (
                        <Link href={`/lesson/${targetLessonId}`}>
                          {moduleContent}
                      </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {showBanner && announcements.some(a => !a.is_read) && (
          <AnnouncementBanner
            announcements={announcements}
            onMarkAsRead={handleMarkAsRead}
            onClose={() => setShowBanner(false)}
          />
        )}

        {showAnnouncementsList && (
          <AnnouncementsList
            announcements={announcements}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClose={() => setShowAnnouncementsList(false)}
          />
        )}

        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gradient-to-b from-[#1a1d22] to-[#0f1012] rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white">Notification Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white transition-all hover:rotate-90 duration-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <PushNotificationSettings />
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}