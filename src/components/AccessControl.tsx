'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AccessLevel } from '@/types/auth';

interface AccessControlProps {
  children: ReactNode;
  requiredLevel: AccessLevel;
  fallback?: ReactNode;
  lessonId?: string;
}

export default function AccessControl({ children, requiredLevel, fallback, lessonId }: AccessControlProps) {
  const { hasAccess, user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-400">Please log in to access this content.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && user && user.access_level === 5) {
      window.location.href = '/service-unavailable';
    }
  }, [user]);

  if (user && user.access_level === 5) {
    return null;
  }

  if (!hasAccess(requiredLevel, lessonId)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (user.access_level === 6) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-red-400">Access Denied</h2>
              <p className="text-gray-300 mb-4">
                Your access is limited to the "New method for bypassing creative moderation" lesson only.
              </p>
              <p className="text-sm text-gray-400">
                Your current access level: {user.access_level} - Creative Push Only
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-red-400">Access Denied</h2>
            <p className="text-gray-300 mb-4">
              This content requires {requiredLevel === 2 ? 'Mentorship' : 'Mentorship'} access.
            </p>
            <p className="text-sm text-gray-400">
              Your current access level: Package {user.access_level}
            </p>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold mb-3">Available Packages:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
                <span>Knowledge Base</span>
                <span className="text-green-400">✓ Included</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
                <span>Mentorship</span>
                <span className={user.access_level >= 2 ? "text-green-400" : "text-gray-500"}>
                  {user.access_level >= 2 ? "✓ Included" : "✗ Not included"}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
                <span>Mentorship (Full)</span>
                <span className={user.access_level >= 3 ? "text-green-400" : "text-gray-500"}>
                  {user.access_level >= 3 ? "✓ Included" : "✗ Not included"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
