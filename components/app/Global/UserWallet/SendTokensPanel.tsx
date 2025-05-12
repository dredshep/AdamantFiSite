// C:\Users\sebas\projects\AdamantFiSite\components\app\Global\UserWallet\SendTokensPanel.tsx

import { useTokenStore } from '@/store/tokenStore';
import { SecretString } from '@/types';
import { sendTokens } from '@/utils/wallet/sendTokens';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { CloseButton } from '../../Shared/CloseButton';

interface SendTokensPanelProps {
  walletAddress: SecretString;
  onClose: () => void; // Switches back to the 'main' view in WalletSidebar
}

export const SendTokensPanel: React.FC<SendTokensPanelProps> = ({ walletAddress, onClose }) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('uscrt');
  const { listAllTokens } = useTokenStore();
  const tokens = listAllTokens() ?? [];

  const handleSend = async () => {
    try {
      if (!recipientAddress || !amount) {
        toast.error('Please fill in all fields');
        return;
      }

      await sendTokens({
        fromAddress: walletAddress,
        toAddress: recipientAddress as SecretString,
        amount,
        denom: selectedToken,
      });

      toast.success('Transaction submitted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to send tokens');
      console.error(error);
    }
  };

  return (
    <aside className="flex flex-col h-screen w-[312px] fixed top-0 right-0 bg-adamant-box-veryDark">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-xl font-bold bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark bg-clip-text text-transparent">
          Send Tokens
        </h2>
        <button
          onClick={onClose}
          className="text-adamant-accentText hover:text-white transition-colors duration-200 p-2 rounded-lg hover:bg-white/5"
        >
          <CloseButton />
        </button>
      </div>

      {/* Scrollable middle */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        <div>
          <label className="block text-sm text-adamant-accentText font-medium mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="w-full bg-adamant-app-input/50 backdrop-blur-sm border border-adamant-gradientBright/20 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none transition-all hover:bg-adamant-app-input/70 focus:bg-adamant-app-input/90"
            placeholder="secret1..."
          />
        </div>

        <div>
          <label className="block text-sm text-adamant-accentText font-medium mb-2">Amount</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-adamant-app-input/50 backdrop-blur-sm border border-adamant-gradientBright/20 rounded-xl px-4 py-3 pr-24 text-white font-mono text-sm outline-none transition-all hover:bg-adamant-app-input/70 focus:bg-adamant-app-input/90 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.0"
            />
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-adamant-app-input/70 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white border border-adamant-gradientBright/20 outline-none transition-all hover:bg-adamant-app-input/90 focus:border-adamant-gradientBright/30 cursor-pointer text-sm font-medium"
            >
              <option value="uscrt">SCRT</option>
              {tokens.map((token, index) => (
                <option key={index} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Footer pinned at bottom */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => void handleSend()}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark text-black font-bold uppercase hover:from-adamant-gradientDark hover:to-adamant-gradientBright transition-all duration-300 shadow-[0_0_20px_-4px_rgba(167,142,90,0.3)]"
        >
          Send
        </button>
      </div>
    </aside>
  );
};
