import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { useTokenStore } from '@/store/tokenStore';
import { SecretString } from '@/types';
import { showToastOnce } from '@/utils/toast/toastManager';
import { sendTokens } from '@/utils/wallet/sendTokens';
import React, { useEffect, useRef, useState } from 'react';
import { RiArrowDownSLine } from 'react-icons/ri';

interface SendTokensPanelProps {
  walletAddress: SecretString;
  onClose: () => void; // Switches back to the 'main' view in WalletSidebar
}

export const SendTokensPanel: React.FC<SendTokensPanelProps> = ({ walletAddress, onClose }) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('uscrt');
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { listAllTokens } = useTokenStore();
  const tokens = listAllTokens() ?? [];

  // Add SCRT as the first option
  const allTokenOptions = [{ symbol: 'SCRT', address: 'uscrt', name: 'Secret Network' }, ...tokens];

  const selectedTokenData =
    allTokenOptions.find(
      (token) => token.address === selectedToken || token.symbol === selectedToken
    ) ?? allTokenOptions[0]!;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTokenDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async () => {
    try {
      if (!recipientAddress || !amount) {
        showToastOnce('send-validation-error', 'Please fill in all fields', 'error');
        return;
      }

      await sendTokens({
        fromAddress: walletAddress,
        toAddress: recipientAddress as SecretString,
        amount,
        denom: selectedToken,
      });

      showToastOnce('send-success', 'Transaction submitted successfully', 'success', {
        message: 'Balances are automatically refreshed every 10 seconds',
      });
      onClose();
    } catch (error) {
      showToastOnce('send-error', 'Failed to send tokens', 'error', {
        message: 'Please check your inputs and try again',
      });
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable middle */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <label className="block text-sm text-adamant-text-box-main font-medium mb-3">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="w-full bg-adamant-box-dark/50 backdrop-blur-sm border border-adamant-box-border rounded-xl px-4 py-3 text-adamant-text-box-main font-mono text-sm outline-none transition-all hover:bg-adamant-box-dark/70 focus:bg-adamant-box-dark/90 focus:border-adamant-gradientBright/50"
            placeholder="secret1..."
          />
        </div>

        <div>
          <label className="block text-sm text-adamant-text-box-main font-medium mb-3">
            Amount & Token
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-adamant-box-dark/50 backdrop-blur-sm border border-adamant-box-border rounded-xl px-4 py-3 pr-32 text-adamant-text-box-main font-mono text-sm outline-none transition-all hover:bg-adamant-box-dark/70 focus:bg-adamant-box-dark/90 focus:border-adamant-gradientBright/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.0"
            />

            {/* Custom Token Selector */}
            <div ref={dropdownRef} className="absolute right-2 top-1/2 -translate-y-1/2">
              <button
                type="button"
                onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                className="flex items-center gap-2 bg-adamant-box-regular hover:bg-adamant-box-light border border-adamant-box-border rounded-lg px-3 py-2 transition-all duration-200"
              >
                <TokenImageWithFallback
                  tokenAddress={selectedTokenData.address as SecretString}
                  size={20}
                  alt={selectedTokenData.symbol}
                  className="rounded-full"
                />
                <span className="text-adamant-text-box-main text-sm font-medium">
                  {selectedTokenData.symbol}
                </span>
                <RiArrowDownSLine
                  className={`w-4 h-4 text-adamant-text-box-secondary transition-transform ${
                    isTokenDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown */}
              {isTokenDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-adamant-box-dark border border-adamant-box-border rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                  {allTokenOptions.map((token, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSelectedToken(token.address);
                        setIsTokenDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-adamant-box-regular transition-colors text-left"
                    >
                      <TokenImageWithFallback
                        tokenAddress={token.address as SecretString}
                        size={24}
                        alt={token.symbol}
                        className="rounded-full"
                      />
                      <div className="flex flex-col">
                        <span className="text-adamant-text-box-main text-sm font-medium">
                          {token.symbol}
                        </span>
                        <span className="text-adamant-text-box-secondary text-xs">
                          {token.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer pinned at bottom */}
      <div className="p-4 border-t border-adamant-box-border">
        <button
          onClick={() => void handleSend()}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark text-black font-bold uppercase hover:from-adamant-gradientDark hover:to-adamant-gradientBright transition-all duration-300 shadow-[0_0_20px_-4px_rgba(167,142,90,0.3)]"
        >
          Send
        </button>
      </div>
    </div>
  );
};
