'use client';

import { Bell } from 'lucide-react';

interface AnnouncementsButtonProps {
  unreadCount: number;
  onClick: () => void;
}

export default function AnnouncementsButton({
  unreadCount,
  onClick
}: AnnouncementsButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2.5 text-gray-400 hover:text-red-400 transition-all duration-300 hover:scale-110 group"
      title="View announcements"
    >
      <div className={`relative ${unreadCount > 0 ? 'animate-pulse' : ''}`}>
        <Bell className="w-5 h-5 group-hover:animate-swing transition-transform duration-300" />
      {unreadCount > 0 && (
          <>
            <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-700 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-red-900/60 animate-bounce border-2 border-black">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
            <span className="absolute -top-2 -right-2 bg-red-600 rounded-full w-5 h-5 animate-ping opacity-75"></span>
          </>
      )}
      </div>
    </button>
  );
}

