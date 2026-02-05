'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface AccessRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccessRestrictionModal({ isOpen, onClose }: AccessRestrictionModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/90"
        onClick={onClose}
      />
      
      <div className="relative bg-[#0f1012] rounded-lg shadow-2xl max-w-md w-full border border-gray-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-6">
            Access Restricted
          </h2>
          
          <div className="space-y-6 mb-8">
            <p className="text-gray-300 text-center leading-relaxed">
              Your access is limited to the <span className="text-red-600 font-semibold">"New method for bypassing creative moderation"</span> lesson only.
            </p>

            <p className="text-gray-400 text-center text-sm">
              Want to unlock full access to all lessons?
            </p>
          </div>

          <a
            href="https://t.me/nayborovskiy"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 text-center"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Contact on Telegram
            </span>
          </a>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

