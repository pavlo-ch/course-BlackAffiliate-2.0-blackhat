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
  const { data, error } = await supabase
    .from('crypto_wallets')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching crypto wallets:', error);
    throw error;
  }

  return data || [];
};

export const getUserBalance = async (userId: string): Promise<UserBalance | null> => {
  const { data, error } = await supabase
    .from('user_balances')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "Relation null" (no rows found)
    console.error('Error fetching user balance:', error);
    throw error;
  }

  return data;
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
