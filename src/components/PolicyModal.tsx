'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PolicyModal({ isOpen, onClose }: PolicyModalProps) {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch('/policy.md')
        .then(res => res.text())
        .then(text => setContent(text))
        .catch(() => setContent('Failed to load policy.'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#0f1012] rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Platform Usage Policy</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-invert max-w-none">
            {content.split('\n').map((line, index) => {
              if (line.startsWith('# ')) {
                return <h1 key={index} className="text-3xl font-bold text-white mb-4 mt-6">{line.replace('# ', '')}</h1>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={index} className="text-2xl font-bold text-white mb-3 mt-5">{line.replace('## ', '')}</h2>;
              }
              if (line.startsWith('* ')) {
                return <li key={index} className="text-gray-300 mb-2 ml-6">{line.replace('* ', '')}</li>;
              }
              if (line.trim() === '') {
                return <div key={index} className="h-2" />;
              }
              return <p key={index} className="text-gray-300 mb-3 leading-relaxed">{line}</p>;
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-primary hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
