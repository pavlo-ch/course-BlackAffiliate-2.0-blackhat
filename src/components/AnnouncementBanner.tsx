'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { AnnouncementWithReadStatus } from '@/types/announcements';

interface AnnouncementBannerProps {
  announcements: AnnouncementWithReadStatus[];
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}

export default function AnnouncementBanner({
  announcements,
  onMarkAsRead,
  onClose
}: AnnouncementBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const unreadAnnouncements = announcements.filter(a => !a.is_read);

  useEffect(() => {
    if (unreadAnnouncements.length === 0) {
      setIsVisible(false);
    }
  }, [unreadAnnouncements.length]);

  if (!isVisible || unreadAnnouncements.length === 0) {
    return null;
  }

  const currentAnnouncement = unreadAnnouncements[currentIndex];
  const hasMore = currentIndex < unreadAnnouncements.length - 1;

  const handleMarkAsRead = () => {
    console.log('🎯 AnnouncementBanner: Mark as read clicked');
    onMarkAsRead(currentAnnouncement.id);
    if (hasMore) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsVisible(false);
      onClose();
    }
  };

  const handleNext = () => {
    if (hasMore) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-gradient-to-br from-[#1a1d22] to-[#0f1012] text-white shadow-2xl border border-red-900/60 rounded-2xl max-w-sm w-[92vw] sm:w-96 overflow-hidden backdrop-blur-sm flex flex-col" style={{ maxHeight: '70vh' }}>
        <div className="px-5 py-3 bg-gradient-to-r from-red-900/40 via-red-800/30 to-transparent flex items-center justify-between border-b border-red-900/30 flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Sparkles className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
            <h3 className="text-sm font-bold truncate">{currentAnnouncement.title}</h3>
            {currentAnnouncement.is_edited && (
              <span className="bg-blue-600/30 text-blue-300 text-[10px] px-1.5 py-0.5 rounded-full border border-blue-500/40 flex-shrink-0">
                EDIT
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-red-300 hover:text-red-100 transition-all hover:rotate-90 duration-300 ml-2"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {currentAnnouncement.image_url && (
            <div className="relative flex-shrink-0">
              <img
                src={currentAnnouncement.image_url}
                alt={currentAnnouncement.title}
                className="w-full max-h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
          )}

          <div className="px-5 py-4">
            <p className="text-white/95 text-sm whitespace-pre-wrap leading-relaxed">
              {currentAnnouncement.content}
            </p>

            {currentAnnouncement.is_edited && currentAnnouncement.updated_at && (
              <div className="flex items-center gap-1 text-xs text-blue-400/80 mt-3">
                <Clock className="w-3 h-3" />
                <span>
                  Updated {new Date(currentAnnouncement.updated_at).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-red-900/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAsRead}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-red-900/30 hover:shadow-red-900/50 hover:scale-105"
            >
              Mark as Read
            </button>
            {hasMore && (
              <>
                <button
                  onClick={handleNext}
                  className="bg-[#1a1d22] hover:bg-[#22262c] text-white px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1 border border-red-900/40 hover:border-red-800/60"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-white/50 text-xs ml-auto font-medium bg-gray-800/50 px-2 py-1 rounded-full">
                  {currentIndex + 1} / {unreadAnnouncements.length}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

