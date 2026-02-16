import { supabase } from './supabase';

export interface UserBalance {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
}

export interface CryptoWallet {
  id: string;
  cryptocurrency: string;
  wallet_address: string;
  network: string;
  is_active: boolean;
  min_deposit: number;
}

export interface DepositTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  crypto_address: string;
  transaction_hash: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
}

// Helper to get session token robustly
const getSessionToken = async (): Promise<string | null> => {
  // 1. Try official client with short timeout
  try {
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<{ data: { session: any } }>((_, reject) => 
      // Short 2s timeout for happy path
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );
    
    // We treat timeout as a sign to use fallback, not a hard error
    const { data } = await Promise.race([sessionPromise, timeoutPromise]);
    if (data?.session?.access_token) {
      return data.session.access_token;
    }
  } catch (e) {
    // Ignore error, proceed to fallback
    // console.warn('Supabase client unresponsive, using fallback token retrieval');
  }

  // 2. Fallback: Direct LocalStorage Access
  // This works even if the Supabase client WebSocket is dead/hanging
  if (typeof window !== 'undefined') {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) return null;
      
      // Extract project ID from URL (e.g. https://xyz.supabase.co -> xyz)
      const projectId = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1];
      if (!projectId) return null;

      const key = `sb-${projectId}-auth-token`;
      const item = localStorage.getItem(key);
      if (item) {
        const session = JSON.parse(item);
        return session.access_token || null;
      }
    } catch (e) {
      console.error('Manual token retrieval failed:', e);
    }
  }
  return null;
};

export const getActiveWallets = async (): Promise<CryptoWallet[]> => {
  try {
    const token = await getSessionToken();
    
    if (!token) {
      console.warn('No active session token found for fetching wallets');
      return [];
    }

    const response = await fetch('/api/cabinet/wallets', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('Unauthorized access to wallets (401). Session likely expired.');
        return [];
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed in getActiveWallets:', error);
    return [];
  }
};

export const getUserBalance = async (userId: string): Promise<UserBalance | null> => {
  try {
    const token = await getSessionToken();
    
    if (!token) {
      console.warn('No active session token found for fetching balance');
      return null;
    }

    const response = await fetch('/api/cabinet/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('Unauthorized access to balance (401). Session likely expired.');
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed in getUserBalance:', error);
    return null;
  }
};

export interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const getUserNotifications = async (): Promise<Notification[]> => {
  try {
    const token = await getSessionToken();
    if (!token) return [];

    const response = await fetch('/api/cabinet/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    return data.notifications || [];
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return [];
  }
};

export const markNotificationRead = async (id: string): Promise<boolean> => {
  try {
    const token = await getSessionToken();
    if (!token) return false;

    const response = await fetch('/api/cabinet/notifications', {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to mark read:', error);
    return false;
  }
};

export const createDepositRequest = async (
  userId: string,
  amount: number,
  currency: string,
  cryptoAddress: string,
  transactionHash: string,
  walletCurrency?: string // Added specifically for the notification details
): Promise<DepositTransaction | null> => {
  try {
    const token = await getSessionToken();
    if (!token) throw new Error('No session token');

    const response = await fetch('/api/cabinet/deposit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency,
        crypto_address: cryptoAddress,
        transaction_hash: transactionHash,
        wallet_currency: walletCurrency
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create deposit request');
    }

    return data.transaction;
  } catch (error) {
    console.error('Error creating deposit request:', error);
    throw error;
  }
};

export interface TransactionHistoryItem {
  id: string;
  type: 'deposit' | 'purchase';
  amount: number;
  status: string;
  created_at: string;
  currency?: string;
  service?: { title: string };
  transaction_hash?: string;
}

export const getUserHistory = async (): Promise<TransactionHistoryItem[]> => {
  try {
    const token = await getSessionToken();
    if (!token) return [];

    const response = await fetch('/api/cabinet/history', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
       if (response.status === 401) {
        console.warn('Unauthorized access to history (401). Session likely expired.');
        return [];
      }
      throw new Error(data.message || 'Failed to fetch history');
    }
    
    return data.history || [];
  } catch (error) {
    console.error('Failed to get user history:', error);
    return [];
  }
};
