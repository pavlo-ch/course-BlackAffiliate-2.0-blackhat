'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import CourseNavigation from '@/components/CourseNavigation';
import CourseSearch from '@/components/CourseSearch';
import AnnouncementsButton from '@/components/AnnouncementsButton';
import AnnouncementsList from '@/components/AnnouncementsList';
import { useAuth } from '@/contexts/AuthContext';
import AccessControl from '@/components/AccessControl';
import { Menu, X, Settings, LogOut, Home, Map, Tag, Wrench, Calculator } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AnnouncementWithReadStatus } from '@/types/announcements';

interface NavLesson {
  id: string;
  title: string;
  type: 'lesson' | 'homework' | 'questions';
}

interface NavSection {
  id: string;
  title: string;
  lessons: NavLesson[];
}

interface LessonContextType {
    courseData: NavSection[];
    currentLessonId: string;
    handlePreviousLesson: () => void;
    handleNextLesson: () => void;
    hasPrevious: boolean;
    hasNext: boolean;
}

const LessonContext = createContext<LessonContextType | null>(null);

export const useLessonContext = () => {
    const context = useContext(LessonContext);
    if (!context) {
        throw new Error('useLessonContext must be used within a LessonLayoutClient');
    }
    return context;
};

interface LessonLayoutClientProps {
  courseData: NavSection[];
  children: React.ReactNode;
}

export default function LessonLayoutClient({ courseData, children }: LessonLayoutClientProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentLessonId = pathname.split('/').pop() || '';
  const [announcements, setAnnouncements] = useState<AnnouncementWithReadStatus[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAnnouncementsList, setShowAnnouncementsList] = useState(false);

  const isLevel6 = user?.access_level === 6;

  const handleLessonSelect = (lessonId: string) => {
    if (isLevel6 && lessonId !== 'lesson-4-9') {
      return;
    }
    router.push(`/lesson/${lessonId}`);
    setIsMobileNavOpen(false);
  };

  const allLessons = courseData.flatMap(section => section.lessons.map(lesson => ({ id: lesson.id })));
  const currentLessonIndex = allLessons.findIndex(l => l.id === currentLessonId);

  // Preload next lesson
  useEffect(() => {
    const nextLessonIndex = currentLessonIndex + 1;
    if (nextLessonIndex < allLessons.length) {
      const nextLessonId = allLessons[nextLessonIndex].id;
      // Preload next lesson content
      router.prefetch(`/lesson/${nextLessonId}`);
    }
  }, [currentLessonIndex, allLessons, router]);

  const handlePreviousLesson = () => {
    if (isLevel6) {
      return;
    }
    if (currentLessonIndex > 0) {
      router.push(`/lesson/${allLessons[currentLessonIndex - 1].id}`);
    }
  };

  const handleNextLesson = () => {
    if (isLevel6) {
      return;
    }
    if (currentLessonIndex < allLessons.length - 1) {
      router.push(`/lesson/${allLessons[currentLessonIndex + 1].id}`);
    }
  };

  const hasPrevious = isLevel6 ? false : currentLessonIndex > 0;
  const hasNext = isLevel6 ? false : currentLessonIndex < allLessons.length - 1;

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          console.warn('No auth token available for loading announcements');
          return;
        }
        
        const res = await fetch('/api/announcements', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          console.error('Announcements API error:', res.status, res.statusText);
          return;
        }
        
        const data = await res.json();
        if (data?.success) {
          setAnnouncements(data.announcements || []);
          setUnreadCount(data.unread_count || 0);
        } else {
          console.error('Announcements API returned error:', data?.message);
        }
      } catch (e) {
        console.error('Announcements load error:', e);
      }
    };

    loadAnnouncements();

    const channel = supabase
      .channel('announcements-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'announcements' 
      }, () => {
        loadAnnouncements();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_read_announcements' 
      }, () => {
        loadAnnouncements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      await fetch(`/api/announcements/${id}/mark-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = announcements.filter(a => !a.is_read).map(a => a.id);
      if (unreadIds.length === 0) return;

      setAnnouncements(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadCount(0);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      await Promise.all(unreadIds.map(id => 
        fetch(`/api/announcements/${id}/mark-read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        })
      ));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <LessonContext.Provider value={{ courseData, currentLessonId, handlePreviousLesson, handleNextLesson, hasPrevious, hasNext }}>
      <div className="min-h-[100svh] bg-background flex relative">
        {isMobileNavOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsMobileNavOpen(false)} />
        )}
        
        <div className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-[#0f1012] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-full lg:h-auto flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Navigation</h2>
              <button onClick={() => setIsMobileNavOpen(false)} className="text-gray-400 hover:text-white lg:hidden">
                <X className="w-6 h-6" />
              </button>
            </div>

            <Link href="/" className="mx-4 mt-4 flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700 px-3 py-3 rounded-lg transition-colors text-white font-medium">
              <Home className="w-4 h-4" />
              Home
            </Link>
            
            <CourseNavigation 
              courseData={courseData}
              currentLessonId={currentLessonId}
              onLessonSelect={handleLessonSelect}
            />
              
            <div className='px-4 pb-4 border-b border-gray-700'>
              <div className={`grid ${user?.access_level === 4 ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
                {user?.access_level !== 4 && (
                  <AccessControl requiredLevel={3} fallback={
                    <div 
                      className="flex flex-col items-center gap-1 text-xs bg-gray-600 px-2 py-2 rounded-lg text-white font-medium cursor-not-allowed opacity-50"
                      title="VIP Only"
                    >
                      <Map className="w-4 h-4" />
                      <span className="text-center">Road Map</span>
                    </div>
                  }>
                    <a
                      href="https://miro.com/app/board/uXjVJP7Hcs8=/?embedMode=view_only_without_ui&moveToViewport=-51326,-112706,83650,46586&embedId=621168039653"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 text-xs bg-red-600 hover:bg-red-700 px-2 py-2 rounded-lg transition-colors text-white font-medium"
                    >
                      <Map className="w-4 h-4" />
                      <span className="text-center">Road Map</span>
                    </a>
                  </AccessControl>
                )}
                <AccessControl requiredLevel={1} fallback={
                  <div 
                    className="flex flex-col items-center gap-1 text-xs bg-gray-600 px-2 py-2 rounded-lg text-white font-medium cursor-not-allowed opacity-50"
                    title="Basic+ Only"
                  >
                    <Tag className="w-4 h-4" />
                    <span className="text-center">Offers</span>
                  </div>
                }>
                <Link href="/offers" className="flex flex-col items-center justify-center gap-1 text-xs bg-orange-600 hover:bg-orange-700 px-2 py-2 rounded-lg transition-colors text-white font-medium">
                  <Tag className="w-4 h-4" />
                  <span className="text-center">Offers</span>
                </Link>
                </AccessControl>
                <AccessControl requiredLevel={2} fallback={
                  <div 
                    className="flex flex-col items-center gap-1 text-xs bg-gray-600 px-2 py-2 rounded-lg text-white font-medium cursor-not-allowed opacity-50"
                    title="Premium+"
                  >
                    <Wrench className="w-4 h-4" />
                    <span className="text-center">Tools</span>
                  </div>
                }>
                  <Link href="/tools" className="flex flex-col items-center gap-1 text-xs bg-green-600 hover:bg-green-700 px-2 py-2 rounded-lg transition-colors text-white font-medium">
                    <Wrench className="w-4 h-4" />
                    <span className="text-center">Tools</span>
                  </Link>
                </AccessControl>
                <AccessControl requiredLevel={1}>
                  <Link href="/calculator" className="flex flex-col items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 px-2 py-2 rounded-lg transition-colors text-white font-medium">
                    <Calculator className="w-4 h-4" />
                    <span className="text-center">Calculator</span>
                  </Link>
                </AccessControl>
              </div>
            </div>
            <div className="p-4 mt-auto">
              <div className="text-sm text-gray-400 mb-2">Logged in as:</div>
              <div className="text-white font-medium mb-2">{user?.email}</div>
              {user?.access_level !== 4 && (
                <div className="text-white mb-3">
                  <span className="text-xs text-gray-400">Package: </span>
                  <span className="text-xs font-bold text-white">
                    {user?.access_level === 1 ? 'Basic' : user?.access_level === 2 ? 'Premium' : 'VIP'}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {isAdmin() && (
                  <Link href="/admin" className="flex items-center gap-2 text-sm bg-primary hover:bg-red-700 px-3 py-2 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
                <button onClick={logout} className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="bg-[#0f1012] border-b border-gray-700 relative z-[10] lg:h-[61px]">
            <div className="max-w-7xl mx-auto px-4 lg:py-2">
              <div className="flex items-center justify-between gap-4">
                <div className="lg:hidden flex-shrink-0">
                  <button 
                    onClick={() => setIsMobileNavOpen(true)} 
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Open navigation"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 max-w-2xl mx-auto">
                  <CourseSearch />
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="lg:hidden">
                    <Link href="/" className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors" title="Home">
                      <Home className="w-5 h-5" />
                    </Link>
                  </div>

                  <AnnouncementsButton
                    unreadCount={unreadCount}
                    onClick={() => setShowAnnouncementsList(true)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>

        {showAnnouncementsList && (
          <AnnouncementsList
            announcements={announcements}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClose={() => setShowAnnouncementsList(false)}
          />
        )}
      </div>
    </LessonContext.Provider>
  );
}