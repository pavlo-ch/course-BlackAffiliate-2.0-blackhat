import React, { useState } from 'react';
import { CryptoWallet } from '@/lib/cabinet';
import { createDepositRequest } from '@/lib/cabinet';
import { useAuth } from '@/contexts/AuthContext';
import { sendTelegramNotification } from '@/lib/telegram';

interface TopUpTabsProps {
  wallets: CryptoWallet[];
  onDepositSuccess?: () => void;
}

export const TopUpTabs: React.FC<TopUpTabsProps> = ({ wallets, onDepositSuccess }) => {
  const { user } = useAuth();
  const [selectedWallet, setSelectedWallet] = useState<CryptoWallet | null>(wallets[0] || null);
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedWallet) return;

    setStatus('idle');
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (!amount || isNaN(parseFloat(amount))) throw new Error('Invalid amount');
      if (!txHash) throw new Error('Transaction hash is required');

      await createDepositRequest(
        user.id,
        parseFloat(amount),
        'USD', // Assuming USD base for now, or match wallet currency logic if needed
        selectedWallet.wallet_address,
        txHash
      );

      // Send TG Notification
      const message = `<b>New Deposit Request</b>\n\n User: ${user.name} (${user.email})\n Amount: ${amount} USD\n Crypto: ${selectedWallet.cryptocurrency}\n Hash: <code>${txHash}</code>\n Date: ${new Date().toLocaleString()}`;
      await sendTelegramNotification(message);

      setStatus('success');
      setAmount('');
      setTxHash('');
      if (onDepositSuccess) onDepositSuccess();
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to submit deposit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast here
  };

  if (!wallets.length) {
    return (
      <div className="text-gray-500 text-center py-8">
        No active deposit methods available. Please contact support.
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-xl mt-6">
      <div className="border-b border-[#2A2A2A] bg-[#222]">
        <div className="flex px-6 pt-4 space-x-4 overflow-x-auto">
          <button
            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
               'border-blue-500 text-white'
            }`}
          >
            Crypto Deposit
          </button>
          {/* Add more tabs here if needed */}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Wallet Selection & Info */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Select Cryptocurrency
            </label>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => setSelectedWallet(wallet)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedWallet?.id === wallet.id
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-[#333] bg-[#222] text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <div className="font-bold">{wallet.cryptocurrency}</div>
                  <div className="text-xs opacity-70">{wallet.network}</div>
                </button>
              ))}
            </div>

            {selectedWallet && (
              <div className="bg-[#111] rounded-xl p-4 border border-[#333]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">Deposit Address ({selectedWallet.network})</span>
                  <button 
                    onClick={() => copyToClipboard(selectedWallet.wallet_address)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="font-mono text-sm text-gray-300 break-all bg-black/30 p-2 rounded border border-white/5">
                  {selectedWallet.wallet_address}
                </div>
                <div className="mt-3 text-xs text-yellow-500/80 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                  ⚠️ Send only <strong>USDT or USDC</strong> to this address.
                  Minimum deposit: {selectedWallet.min_deposit || 0}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  required
                />
             </div>

             <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                  Transaction Hash (TXID)
                </label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Enter transaction hash..."
                  className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                  required
                />
             </div>

             <button
               type="submit"
               disabled={isSubmitting || !selectedWallet}
               className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                 isSubmitting 
                   ? 'bg-gray-600 cursor-not-allowed' 
                   : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 active:scale-[0.98]'
               }`}
             >
               {isSubmitting ? 'Verifying...' : 'I Have Paid'}
             </button>

             {status === 'success' && (
               <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center">
                 Deposit request submitted! Waiting for admin approval.
               </div>
             )}
              {status === 'error' && (
               <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                 {errorMessage}
               </div>
             )}
          </form>
        </div>
      </div>
    </div>
  );
};
