import React from 'react';

interface BalanceCardProps {
  balance: number;
  currency: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balance, currency }) => {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">
          Current Balance
        </h3>
        <div className="flex items-baseline space-x-2">
          <span className="text-4xl font-bold text-white tracking-tight">
            {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xl text-gray-500 font-medium">{currency}</span>
        </div>
        
        <div className="mt-4 flex items-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Active</span>
        </div>
      </div>
    </div>
  );
};
