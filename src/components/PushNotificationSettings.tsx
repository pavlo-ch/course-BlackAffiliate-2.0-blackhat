import { useState, useEffect } from 'react';
import { Bell, BellOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getExistingSubscription
} from '@/lib/pushNotifications';

export default function PushNotificationSettings() {
  const { accessToken } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    checkPushStatus();
  }, []);

  const checkPushStatus = async () => {
    if (!('Notification' in window)) {
      setError('Browser does not support notifications');
      return;
    }

    setPermissionStatus(Notification.permission);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await getExistingSubscription(registration);
        setIsEnabled(!!subscription);
      }
    } catch (err) {
      console.error('Error checking push status:', err);
    }
  };

  const handleTogglePush = async () => {
    if (isEnabled) {
      await disablePush();
    } else {
      await enablePush();
    }
  };

  const enablePush = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const permission = await requestNotificationPermission();
      
      if (permission !== 'granted') {
        setError('Notification permission denied');
        setIsLoading(false);
        return;
      }

      setPermissionStatus(permission);

      const registration = await registerServiceWorker();
      if (!registration) {
        setError('Failed to register service worker');
        setIsLoading(false);
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
      if (!vapidPublicKey) {
        setError('VAPID key not configured');
        setIsLoading(false);
        return;
      }

      const subscription = await subscribeToPush(registration, vapidPublicKey);
      if (!subscription) {
        setError('Failed to subscribe to push notifications');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsEnabled(true);
      } else {
        setError(data.message || 'Failed to save subscription');
      }
    } catch (err) {
      console.error('Error enabling push notifications:', err);
      setError('Failed to enable push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const disablePush = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await getExistingSubscription(registration);
        
        if (subscription) {
          await fetch(`/api/push-subscription?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
            method: 'DELETE',
            headers: {
              'Authorization': accessToken ? `Bearer ${accessToken}` : '',
            }
          });

          await unsubscribeFromPush(registration);
        }
      }

      setIsEnabled(false);
    } catch (err) {
      console.error('Error disabling push notifications:', err);
      setError('Failed to disable push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-3 text-gray-400">
          <BellOff className="w-5 h-5" />
          <span className="text-sm">Push notifications are not supported in this browser</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isEnabled ? 'bg-green-600/20' : 'bg-gray-700'}`}>
            {isEnabled ? (
              <Bell className="w-6 h-6 text-green-400" />
            ) : (
              <BellOff className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Push Notifications</h3>
            <p className="text-sm text-gray-400">
              {isEnabled ? 'Enabled - You will receive new announcement alerts' : 'Get instant notifications for new announcements'}
            </p>
          </div>
        </div>
        <button
          onClick={handleTogglePush}
          disabled={isLoading}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-green-600' : 'bg-gray-600'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-900/20 border border-red-800/40 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {permissionStatus === 'denied' && (
        <div className="mt-3 p-3 bg-orange-900/20 border border-orange-800/40 rounded-lg">
          <p className="text-sm text-orange-300">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        </div>
      )}
    </div>
  );
}

