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

export const getActiveWallets = async (): Promise<CryptoWallet[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.warn('No active session for fetching wallets');
      return [];
    }

    const response = await fetch('/api/cabinet/wallets', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
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
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.warn('No active session for fetching balance');
      return null;
    }

    const response = await fetch('/api/cabinet/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed in getUserBalance:', error);
    return null;
  }
};

export const createDepositRequest = async (
  userId: string,
  amount: number,
  currency: string,
  cryptoAddress: string,
  transactionHash: string
): Promise<DepositTransaction | null> => {
  const { data, error } = await supabase
    .from('deposit_transactions')
    .insert([
      {
        user_id: userId,
        amount,
        currency,
        crypto_address: cryptoAddress,
        transaction_hash: transactionHash,
        status: 'pending',
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating deposit request:', error);
    throw error;
  }

  return data;
};
