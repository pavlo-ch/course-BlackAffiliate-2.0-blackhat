'use client';

import React from 'react';
import { AnnouncementWithReadStatus } from '@/types/announcements';
import { CheckCircle, Circle, X, Clock, Calendar } from 'lucide-react';

interface AnnouncementsListProps {
  announcements: AnnouncementWithReadStatus[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export default function AnnouncementsList({
  announcements,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose
}: AnnouncementsListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  React.useEffect(() => {
    const unreadAnnouncements = announcements.filter(a => !a.is_read);
    if (unreadAnnouncements.length === 0) return;

    const timer = setTimeout(() => {
      onMarkAllAsRead();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-[#1a1d22] to-[#0f1012] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-red-900/40">
        <div className="flex items-center justify-between p-6 border-b border-red-800/40 bg-gradient-to-r from-red-900/30 via-red-800/20 to-transparent backdrop-blur-sm">
          <div>
          <h2 className="text-2xl font-bold text-white">Announcements</h2>
            <p className="text-sm text-gray-400 mt-1">
              {announcements.filter(a => !a.is_read).length} unread
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-300 transition-all hover:rotate-90 duration-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {announcements.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <X className="w-10 h-10 text-gray-500" />
              </div>
              <p className="text-gray-400 text-lg">No announcements yet</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-gradient-to-br rounded-xl p-5 border-l-4 transition-all duration-300 hover:scale-[1.01] ${
                  announcement.is_read
                    ? 'from-gray-800/50 to-gray-900/30 border-gray-600 shadow-md'
                    : 'from-red-900/20 to-gray-800/50 border-red-600 shadow-lg shadow-red-900/20'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="mb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <button
                        onClick={() => !announcement.is_read && onMarkAsRead(announcement.id)}
                        className={`flex-shrink-0 transition-all duration-300 ${
                          announcement.is_read
                            ? 'text-gray-600 cursor-default'
                            : 'text-red-500 hover:text-red-400 cursor-pointer hover:scale-110'
                        }`}
                        disabled={announcement.is_read}
                      >
                        {announcement.is_read ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        {announcement.is_edited && (
                          <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-500/30 flex-shrink-0">
                            Edited
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>{formatDate(announcement.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <h3 className={`text-lg font-bold break-words mb-2 ${
                      announcement.is_read ? 'text-gray-300' : 'text-white'
                    }`}>
                      {announcement.title}
                    </h3>
                    {announcement.is_edited && announcement.updated_at && (
                      <div className="flex items-center gap-1 text-xs text-blue-400 whitespace-nowrap mb-2">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>Updated: {formatDate(announcement.updated_at)}</span>
                      </div>
                    )}
                  </div>

                  <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
                    announcement.is_read ? 'text-gray-400' : 'text-gray-200'
                  }`}>
                    {announcement.content.replace(/\*\*/g, '')}
                  </p>

                  {announcement.image_url && (
                    <div className="mt-4">
                      <img
                        src={announcement.image_url}
                        alt={announcement.title}
                        className="max-h-72 rounded-xl object-cover border border-red-800/30 shadow-lg w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(220, 38, 38, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(220, 38, 38, 0.7);
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

