'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User, LoginCredentials, AuthContextType, RegisterCredentials, RegistrationRequest, AccessLevel } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import type { AuthUser } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || '';

// BroadcastChannel для синхронізації між вкладками
const AUTH_CHANNEL_NAME = 'blackaffiliate-auth-sync';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [loadingStage, setLoadingStage] = useState('Connecting...');
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs для синхронізації між вкладками
  const broadcastChannel = useRef<BroadcastChannel | null>(null);
  const isLeaderTab = useRef<boolean>(false);
  const tabId = useRef<string>(Math.random().toString(36).substring(7));

  // Ініціалізація BroadcastChannel для синхронізації між вкладками
  const initBroadcastChannel = useCallback(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      console.log('🌐 BroadcastChannel not supported, running in single-tab mode');
      isLeaderTab.current = true;
      return;
    }

    try {
      const LEADER_KEY = 'auth-leader-tab';
      const LEADER_TIMEOUT = 5000;
      
      broadcastChannel.current = new BroadcastChannel(AUTH_CHANNEL_NAME);
      
      const tryBecomeLeader = () => {
        const now = Date.now();
        const stored = localStorage.getItem(LEADER_KEY);
        
        if (!stored) {
          localStorage.setItem(LEADER_KEY, JSON.stringify({ tabId: tabId.current, timestamp: now }));
          isLeaderTab.current = true;
          console.log(`👑 [Tab ${tabId.current}] Became leader (no existing leader)`);
          broadcastChannel.current?.postMessage({
            type: 'LEADER_ANNOUNCE',
            senderId: tabId.current
          });
          return true;
        }
        
        try {
          const leader = JSON.parse(stored);
          if (now - leader.timestamp > LEADER_TIMEOUT) {
            localStorage.setItem(LEADER_KEY, JSON.stringify({ tabId: tabId.current, timestamp: now }));
            isLeaderTab.current = true;
            console.log(`👑 [Tab ${tabId.current}] Became leader (previous leader expired)`);
            broadcastChannel.current?.postMessage({
              type: 'LEADER_ANNOUNCE',
              senderId: tabId.current
            });
            return true;
          }
          
          if (leader.tabId === tabId.current) {
            isLeaderTab.current = true;
            return true;
          }
        } catch (e) {
          console.error('Error parsing leader data:', e);
        }
        
        return false;
      };
      
      const updateLeaderHeartbeat = () => {
        if (isLeaderTab.current) {
          const now = Date.now();
          localStorage.setItem(LEADER_KEY, JSON.stringify({ tabId: tabId.current, timestamp: now }));
        }
      };
      
      broadcastChannel.current.onmessage = (event) => {
        const { type, data, senderId } = event.data;
        
        if (senderId === tabId.current) return;
        
        console.log(`📨 [Tab ${tabId.current}] Received message:`, type);
        
        switch (type) {
          case 'LEADER_ANNOUNCE':
            if (senderId !== tabId.current) {
              isLeaderTab.current = false;
              console.log(`👑 [Tab ${tabId.current}] Leader is now: ${senderId}`);
            }
            break;
            
          case 'AUTH_STATE_UPDATE':
            console.log(`🔄 [Tab ${tabId.current}] Syncing auth state from leader`);
            if (data.user) {
              setUser(data.user);
            } else {
              setUser(null);
            }
            setIsInitializing(false);
            break;
            
          case 'LOGOUT':
            console.log(`🚪 [Tab ${tabId.current}] Logout from another tab`);
            setUser(null);
            break;
            
          case 'LEADER_CHECK':
            if (isLeaderTab.current) {
              updateLeaderHeartbeat();
              broadcastChannel.current?.postMessage({
                type: 'LEADER_ANNOUNCE',
                senderId: tabId.current
              });
            }
            break;
        }
      };
      
      broadcastChannel.current?.postMessage({
        type: 'LEADER_CHECK',
        senderId: tabId.current
      });
      
      setTimeout(() => {
        tryBecomeLeader();
      }, 150);
      
      setInterval(updateLeaderHeartbeat, 2000);
      
      window.addEventListener('beforeunload', () => {
        if (isLeaderTab.current) {
          localStorage.removeItem(LEADER_KEY);
        }
      });
      
      console.log(`🌐 [Tab ${tabId.current}] BroadcastChannel initialized`);
    } catch (error) {
      console.error('Failed to initialize BroadcastChannel:', error);
      isLeaderTab.current = true;
    }
  }, []);

  // Відправка оновлення стану всім вкладкам
  const broadcastAuthState = useCallback((userData: User | null) => {
    if (broadcastChannel.current && isLeaderTab.current) {
      try {
        broadcastChannel.current.postMessage({
          type: 'AUTH_STATE_UPDATE',
          data: { user: userData },
          senderId: tabId.current
        });
        console.log(`📤 [Tab ${tabId.current}] Broadcasted auth state`);
      } catch (error) {
        console.error('Failed to broadcast auth state:', error);
      }
    }
  }, []);

  // Очищення невалідної сесії
  const clearInvalidSession = useCallback(async () => {
    console.log('🧹 Clearing invalid session...');
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error during signOut:', e);
    }
    // Очищаємо localStorage від старих токенів
    if (typeof window !== 'undefined') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        try {
          const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
          localStorage.removeItem(storageKey);
        } catch (e) {
          console.error('Error clearing localStorage:', e);
        }
      }
    }
    setUser(null);
    broadcastAuthState(null);
  }, [broadcastAuthState]);

  const checkSupabaseHealth = async (): Promise<boolean> => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase credentials');
        return false;
      }

      if (typeof window === 'undefined') {
        return false;
      }

      const response = await Promise.race([
        fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          }
        }),
        new Promise<Response>((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 3000)
        )
      ]);
      
      return response.ok || response.status === 401;
    } catch (error: any) {
      if (error?.message === 'Health check timeout') {
        console.warn('AuthContext: Health check timeout');
      } else {
        console.error('💥 AuthContext: Health check failed:', error);
      }
      return false;
    }
  };

  const initializeAuthWithRetry = async (attempt: number = 1): Promise<void> => {
    try {
      if (typeof window === 'undefined') {
        setIsInitializing(false);
        return;
      }

      // Тільки leader вкладка ініціалізує auth
      if (!isLeaderTab.current) {
        console.log(`⏳ [Tab ${tabId.current}] Waiting for leader to initialize auth...`);
        setLoadingStage('Syncing with other tabs...');
        
        setTimeout(() => {
          if (isInitializing && !user) {
            console.log(`⚠️ [Tab ${tabId.current}] No sync after 10s, becoming leader`);
            isLeaderTab.current = true;
            initializeAuthWithRetry(1);
          }
        }, 10000);
        
        return;
      }

      console.log(`👑 [Tab ${tabId.current}] Leader initializing auth (attempt ${attempt}/3)`);
      setLoadingStage(`Connecting... (attempt ${attempt}/3)`);
      setRetryCount(attempt);

      const isHealthy = await checkSupabaseHealth();
      if (!isHealthy && attempt < 3) {
        throw new Error('Supabase health check failed');
      }

      setLoadingStage('Checking authentication...');
      
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<{ data: { session: null }, error: { message: string } }>((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 20000)
        )
      ]) as { data: { session: any }, error: any };
      
      const { data: { session }, error } = sessionResult;
      
      // Обробка помилки Invalid Refresh Token
      if (error && (
        error.message?.includes('Invalid Refresh Token') ||
        error.message?.includes('Refresh Token Not Found') ||
        error.code === 'refresh_token_not_found'
      )) {
        console.warn('🔑 Invalid refresh token in session check, clearing session');
        await clearInvalidSession();
        setIsInitializing(false);
        return;
      }
      
      if (error && error.message !== 'Session check timeout') {
        console.error('❌ AuthContext: Session error:', error);
        if (attempt >= 3) {
          setUser(null);
          setIsInitializing(false);
          return;
        }
        throw error;
      }

      if (session?.user) {
        setLoadingStage('Loading profile...');
        
        try {
          const profileResult = await Promise.race([
            supabase
          .from('profiles')
          .select('id, name, role, created_at, is_approved, access_level')
          .eq('id', session.user.id)
              .single(),
            new Promise<{ data: null, error: { message: string } }>((_, reject) => 
              setTimeout(() => reject(new Error('Profile check timeout')), 10000)
            )
          ]) as { data: any, error: any };

          const { data: profile, error: profileError } = profileResult;

          if (profileError && profileError.message !== 'Profile check timeout') {
          console.error('❌ AuthContext: Profile error:', profileError);
            if (attempt >= 3) {
              setUser(null);
              setIsInitializing(false);
              return;
            }
          throw profileError;
        }

        if (profile && profile.is_approved) {
          const userObj: User = {
            id: profile.id,
            email: session.user.email!,
            password: '',
            name: profile.name,
            role: profile.role,
            access_level: profile.access_level,
            created_at: profile.created_at,
            lastLogin: new Date(),
            isApproved: true,
          };
          setUser(userObj);
          // Транслюємо стан іншим вкладкам
          broadcastAuthState(userObj);
        } else {
          setUser(null);
          broadcastAuthState(null);
            try {
          await supabase.auth.signOut();
            } catch (signOutError) {
              console.error('Error signing out:', signOutError);
            }
          }
        } catch (profileError: any) {
          if (profileError?.message === 'Profile check timeout') {
            console.warn('AuthContext: Profile check timeout');
            setUser(null);
            setIsInitializing(false);
            return;
          }
          throw profileError;
        }
      } else {
        setUser(null);
      }

      setLoadingStage('Almost ready...');
      setIsInitializing(false);

    } catch (error: any) {
      console.error(`💥 AuthContext: Initialization attempt ${attempt} failed:`, error);
      
      if (attempt < 3 && error?.message !== 'Session check timeout' && error?.message !== 'Profile check timeout') {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        setLoadingStage(`Connection failed. Retrying in ${delay/1000}s...`);
        
        setTimeout(() => {
          initializeAuthWithRetry(attempt + 1);
        }, delay);
      } else {
        console.error('💀 AuthContext: All initialization attempts failed');
        setLoadingStage('Connection failed. Please refresh the page.');
        setUser(null);
        setIsInitializing(false);
      }
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsInitializing(false);
      return;
    }

    let initialCheckCompleted = false;
    let authSubscription: any = null;
    let isMounted = true;

    // Ініціалізуємо BroadcastChannel першим
    initBroadcastChannel();
    
    // Визначаємо лідера перед ініціалізацією (швидкий таймаут)
    const checkLeaderTimeout = setTimeout(() => {
      if (!isLeaderTab.current) {
        isLeaderTab.current = true;
        console.log(`👑 [Tab ${tabId.current}] Became leader (timeout)`);
        if (broadcastChannel.current) {
          broadcastChannel.current.postMessage({
            type: 'LEADER_ANNOUNCE',
            senderId: tabId.current
          });
        }
      }
    }, 150);

    const initializeAuth = async () => {
      try {
        // Чекаємо, поки визначиться лідер (скорочено з 600ms до 200ms)
        await new Promise(resolve => setTimeout(resolve, 200));
        
      await initializeAuthWithRetry();
      
        if (!initialCheckCompleted && isMounted) {
          const subscriptionResult = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;
            
            console.log(`🔔 [Tab ${tabId.current}] Auth state change: ${event}`);
            
            // Обробка помилки токена для всіх вкладок
            if (event === 'TOKEN_REFRESHED' && !session) {
              console.warn('🔑 Token refresh failed, clearing session');
              setUser(null);
              broadcastAuthState(null);
              return;
            }
            
            // Тільки leader обробляє auth state changes
            if (!isLeaderTab.current) {
              console.log(`⏭️ [Tab ${tabId.current}] Skipping auth state change (not leader)`);
              return;
            }

            try {
              if (!isMounted) return;

          if (session?.user) {
                const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id, name, role, created_at, is_approved, access_level')
              .eq('id', session.user.id)
              .single();

                if (!isMounted) return;

                if (profileError) {
                  console.error('AuthContext: Profile error in auth state change:', profileError);
                  if (isMounted) {
                    setUser(null);
                    broadcastAuthState(null);
                  }
                  if (event !== 'SIGNED_OUT') {
                    try {
                      await supabase.auth.signOut();
                    } catch (signOutError) {
                      console.error('Error signing out:', signOutError);
                    }
                  }
                  return;
                }

                if (!isMounted) return;

            if (profile && profile.is_approved) {
              const userObj: User = {
                id: profile.id,
                email: session.user.email!,
                password: '',
                name: profile.name,
                role: profile.role,
                access_level: profile.access_level,
                created_at: profile.created_at,
                lastLogin: new Date(),
                isApproved: true,
              };
                  if (isMounted) {
              setUser(userObj);
                    broadcastAuthState(userObj);
                  }
            } else {
                  if (isMounted) {
              setUser(null);
                    broadcastAuthState(null);
                  }
              if (event !== 'SIGNED_OUT') {
                    try {
                await supabase.auth.signOut();
                    } catch (signOutError) {
                      console.error('Error signing out:', signOutError);
                    }
                  }
                }
              } else {
                if (isMounted) {
                  setUser(null);
                  broadcastAuthState(null);
                }
              }
            } catch (error) {
              console.error('AuthContext: Error in auth state change handler:', error);
              if (isMounted) {
                setUser(null);
                broadcastAuthState(null);
              }
            }
          });
          
          if (subscriptionResult) {
            if (subscriptionResult.data?.subscription) {
              authSubscription = subscriptionResult.data.subscription;
          } else {
              authSubscription = subscriptionResult as any;
            }
          }
        
        initialCheckCompleted = true;
        }
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeAuth();

    const timeoutId = setTimeout(() => {
      if (isInitializing && isMounted) {
        setLoadingStage('Timeout reached. Please refresh if needed.');
        setIsInitializing(false);
      }
    }, 20000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearTimeout(checkLeaderTimeout);
      
      // Закриваємо BroadcastChannel
      if (broadcastChannel.current) {
        try {
          broadcastChannel.current.close();
          console.log(`🌐 [Tab ${tabId.current}] BroadcastChannel closed`);
        } catch (error) {
          console.error('Error closing BroadcastChannel:', error);
        }
        broadcastChannel.current = null;
      }
      
      if (authSubscription) {
        try {
          const sub = authSubscription as any;
          if (sub && typeof sub === 'object') {
            if (typeof sub.unsubscribe === 'function') {
              sub.unsubscribe();
            } else if (sub.data) {
              if (sub.data.subscription && typeof sub.data.subscription.unsubscribe === 'function') {
                sub.data.subscription.unsubscribe();
              } else if (typeof sub.data.unsubscribe === 'function') {
                sub.data.unsubscribe();
              }
            } else if (sub.subscription && typeof sub.subscription.unsubscribe === 'function') {
              sub.subscription.unsubscribe();
            }
          }
        } catch (error) {
          console.error('Error unsubscribing from auth state change:', error);
        }
        authSubscription = null;
      }
    };
  }, [initBroadcastChannel]);

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    let heartbeatInterval: NodeJS.Timeout;
    let visibilityHandler: () => void;
    let beforeUnloadHandler: () => void;

    const updateActivity = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        await fetch('/api/activity', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
      } catch (error) {
        console.error('Error updating activity:', error);
      }
    };

    const markInactive = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        await fetch('/api/activity/inactive', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }).catch(() => {});
      } catch (error) {
        console.error('Error marking inactive:', error);
      }
    };

    updateActivity();

    heartbeatInterval = setInterval(updateActivity, 60000);

    visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        updateActivity();
      } else {
        markInactive();
      }
    };

    beforeUnloadHandler = () => {
      markInactive();
    };

    document.addEventListener('visibilitychange', visibilityHandler);
    window.addEventListener('beforeunload', beforeUnloadHandler);

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      document.removeEventListener('visibilitychange', visibilityHandler);
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      markInactive();
    };
  }, [user]);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; message?: string; isPending?: boolean; requestId?: string }> => {
    setIsLoading(true);
    
    try {
      if (typeof window === 'undefined') {
        return { success: false, message: 'Login is only available on the client side.' };
      }

      const loginResult = await Promise.race([
        supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
        }),
        new Promise<{ data: null, error: { message: string } }>((_, reject) => 
          setTimeout(() => reject(new Error('Login timeout')), 30000)
        )
      ]) as { data: any, error: any };

      const { data, error } = loginResult;

      if (error) {
        return {
          success: false,
          message: error.message || 'Login error. Please try again.',
        };
      }

      if (data?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, role, created_at, is_approved, access_level')
          .eq('id', data.user.id)
          .single();
          
          if (profileError) {
            console.error('Profile fetch error:', profileError);
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error('Error signing out:', signOutError);
            }
            return {
              success: false,
              message: 'Could not load user profile. Please try again.',
            };
          }
          
        if (profile && profile.is_approved) {
          const userObj: User = {
            id: profile.id,
            email: data.user.email!,
            password: '',
            name: profile.name,
            role: profile.role,
            access_level: profile.access_level,
            created_at: profile.created_at,
            lastLogin: new Date(),
            isApproved: true,
          };
          setUser(userObj);
          // Транслюємо стан іншим вкладкам
          broadcastAuthState(userObj);
          return { success: true };
        } else {
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error('Error signing out:', signOutError);
            }
            return {
              success: false,
              message: 'Your account is not approved yet.',
            };
          }
        } catch (profileErr) {
          console.error('Error processing profile:', profileErr);
          try {
          await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Error signing out:', signOutError);
          }
          return {
            success: false,
            message: 'Could not load user profile. Please try again.',
          };
        }
      }
      
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    } catch (error: any) {
      console.error('💥 AuthContext: Catch block - Login error:', error);
      if (error?.message === 'Login timeout') {
        return { success: false, message: 'Login request timed out. Please check your internet connection and try again.' };
      }
      return { success: false, message: 'Could not connect to the server. Check your internet connection.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
      
      // Транслюємо вилогінення всім вкладкам
      if (broadcastChannel.current) {
        broadcastChannel.current.postMessage({
          type: 'LOGOUT',
          senderId: tabId.current
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = useCallback((): boolean => {
    return user?.role === 'admin';
  }, [user?.role]);

  const hasAccess = useCallback((requiredLevel: AccessLevel, lessonId?: string): boolean => {
    if (!user) return false;
    if (user.access_level === 5) return false;
    if (user.access_level === 6) {
      if (lessonId === undefined) {
        return false;
      }
      return lessonId === 'lesson-4-9';
    }
    return user.access_level >= requiredLevel;
  }, [user]);

  const sendTelegramNotification = async (message: string) => {
    console.log('Attempting to send Telegram notification:', message);
    
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn('Telegram credentials not configured');
      console.log('BOT_TOKEN exists:', !!TELEGRAM_BOT_TOKEN);
      console.log('CHAT_ID exists:', !!TELEGRAM_CHAT_ID);
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      });
      
      if (response.ok) {
        console.log('Telegram notification sent successfully');
      } else {
        console.error('Telegram API error:', await response.text());
      }
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            name: credentials.name,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error('Registration error:', data.message);
        setIsLoading(false);
        return false;
      }
      
      const message = `🔔 New registration request\n\n👤 Name: ${credentials.name}\n📧 Email: ${credentials.email}\n🔑 Password: ${credentials.password}\n📅 Date: ${new Date().toLocaleDateString('en-US')}, ${new Date().toLocaleTimeString('en-US')}\n\n⏳ Awaiting administrator approval`;
      await sendTelegramNotification(message);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const getRegistrationRequests = useCallback((): RegistrationRequest[] => {
    return registrationRequests;
  }, [registrationRequests]);

  const loadRegistrationRequests = useCallback(async () => {
    try {
      console.log('📋 AuthContext: Loading registration requests via API...');
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.error('❌ AuthContext: No access token available');
        return;
      }
      
      const response = await fetch('/api/admin/requests', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('❌ AuthContext: API error:', response.status, response.statusText);
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.requests) {
        const formattedRequests = result.requests.map((req: any) => ({
          id: req.id,
          email: req.email,
          password: req.password,
          name: req.name,
          createdAt: req.created_at,
          status: 'pending' as const
        }));
        console.log('✅ AuthContext: Loaded requests:', formattedRequests.length);
        setRegistrationRequests(formattedRequests);
      } else {
        console.warn('⚠️ AuthContext: No requests in response');
      }
    } catch (error) {
      console.error('💥 AuthContext: Catch block - Error loading requests:', error);
    }
  }, []);

  const remindAdmin = async (requestId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/remind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();

      if (!data.success) {
        console.error('Error sending reminder:', data.message);
        return { success: false, message: data.message || 'Failed to send reminder.' };
      }

      return { success: true, message: data.message || 'A reminder has been sent to the administrator.' };
    } catch (error) {
      console.error('Error sending reminder:', error);
      return { success: false, message: 'Failed to send reminder.' };
    }
  };

  const rejectRegistration = async (requestId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();
        
      if (!data.success) {
        console.error('Error rejecting request:', data.message);
        return false;
      }
      
      setRegistrationRequests(prev => prev.filter(r => r.id !== requestId));
      
      const message = `❌ <b>Registration rejected</b>\n\n📧 Email: ${data.request.email}`;
      await sendTelegramNotification(message);
      
      return true;
    } catch (error) {
      console.error('Error rejecting registration:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && user.access_level !== 5,
    isLoading,
    isInitializing,
    loadingStage,
    retryCount,
    login,
    logout,
    isAdmin,
    hasAccess,
    register,
    getRegistrationRequests,
    loadRegistrationRequests,
    rejectRegistration,
    remindAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}