import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { useTokenStore } from '@/store/tokenStore';
import { SecretString } from '@/types';
import { showToastOnce } from '@/utils/toast/toastManager';
import { sendTokens } from '@/utils/wallet/sendTokens';
import * as Dialog from '@radix-ui/react-dialog';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { RiArrowDownSLine, RiCloseLine } from 'react-icons/ri';

interface SendTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: SecretString;
  prefillData?: {
    amount?: string;
    tokenAddress?: string;
    recipientAddress?: string;
  };
}

export const SendTokensDialog = ({
  open,
  onOpenChange,
  walletAddress,
  prefillData,
}: SendTokensDialogProps) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('uscrt');
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { listAllTokens } = useTokenStore();
  const tokens = listAllTokens() ?? [];
  const router = useRouter();

  // Add SCRT as the first option
  const allTokenOptions = [{ symbol: 'SCRT', address: 'uscrt', name: 'Secret Network' }, ...tokens];

  const selectedTokenData =
    allTokenOptions.find(
      (token) => token.address === selectedToken || token.symbol === selectedToken
    ) ?? allTokenOptions[0]!;

  // Handle URL query params for prefilling
  useEffect(() => {
    if (router.query.openSendDialog === 'true') {
      onOpenChange(true);

      if (router.query.amount) {
        setAmount(router.query.amount as string);
      }

      if (router.query.recipient) {
        setRecipientAddress(router.query.recipient as string);
      }

      if (router.query.tokenAddress) {
        setSelectedToken(router.query.tokenAddress as string);
      }

      // Clear the query params after prefilling
      const newQuery = { ...router.query };
      delete newQuery.openSendDialog;
      delete newQuery.amount;
      delete newQuery.recipient;
      delete newQuery.token;
      delete newQuery.tokenAddress;

      void router.replace(
        {
          pathname: router.pathname,
          query: newQuery,
        },
        undefined,
        { shallow: true }
      );
    }
  }, [router.query, onOpenChange, router]);

  // Handle prefillData prop (from modal store)
  useEffect(() => {
    if (prefillData && open) {
      if (prefillData.amount) {
        setAmount(prefillData.amount);
      }
      if (prefillData.recipientAddress) {
        setRecipientAddress(prefillData.recipientAddress);
      }
      if (prefillData.tokenAddress) {
        setSelectedToken(prefillData.tokenAddress);
      }
    }
  }, [prefillData, open]);

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

      setIsLoading(true);

      await sendTokens({
        fromAddress: walletAddress,
        toAddress: recipientAddress as SecretString,
        amount,
        denom: selectedToken,
      });

      showToastOnce('send-success', 'Transaction submitted successfully', 'success', {
        message: 'Balances are automatically refreshed every 10 seconds',
      });
      onOpenChange(false);

      // Reset form
      setRecipientAddress('');
      setAmount('');
      setSelectedToken('uscrt');
    } catch (error) {
      showToastOnce('send-error', 'Failed to send tokens', 'error', {
        message: 'Please check your inputs and try again',
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-adamant-app-box/95 backdrop-blur-xl rounded-2xl w-[440px] max-w-[95vw] max-h-[90vh] overflow-hidden shadow-2xl border border-adamant-gradientBright/20 z-50">
          {/* Header */}
          <div className="relative p-6 border-b border-adamant-box-border/30">
            <div className="absolute inset-0 bg-gradient-to-r from-adamant-gradientBright/5 via-adamant-gradientDark/5 to-transparent" />
            <div className="relative flex items-center justify-between">
              <Dialog.Title className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-6 h-6 text-adamant-gradientBright">💸</div>
                Send Tokens
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 rounded-lg hover:bg-adamant-box-dark/50 transition-all duration-200 text-adamant-text-box-secondary hover:text-white group">
                  <RiCloseLine className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className="block text-sm text-adamant-text-box-main font-medium mb-3">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                disabled={isLoading}
                className="w-full bg-adamant-box-dark/50 backdrop-blur-sm border border-adamant-box-border rounded-xl px-4 py-3 text-adamant-text-box-main font-mono text-sm outline-none transition-all hover:bg-adamant-box-dark/70 focus:bg-adamant-box-dark/90 focus:border-adamant-gradientBright/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={isLoading}
                  className="w-full bg-adamant-box-dark/50 backdrop-blur-sm border border-adamant-box-border rounded-xl px-4 py-3 pr-32 text-adamant-text-box-main font-mono text-sm outline-none transition-all hover:bg-adamant-box-dark/70 focus:bg-adamant-box-dark/90 focus:border-adamant-gradientBright/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="0.0"
                />

                {/* Custom Token Selector */}
                <div ref={dropdownRef} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <button
                    type="button"
                    onClick={() => !isLoading && setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-adamant-box-regular hover:bg-adamant-box-light border border-adamant-box-border rounded-lg px-3 py-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {isTokenDropdownOpen && !isLoading && (
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

          {/* Footer with Send Button */}
          <div className="p-6 border-t border-adamant-box-border/30">
            <button
              onClick={() => void handleSend()}
              disabled={isLoading || !recipientAddress || !amount}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark text-black font-bold uppercase hover:from-adamant-gradientDark hover:to-adamant-gradientBright transition-all duration-300 shadow-[0_0_20px_-4px_rgba(167,142,90,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-adamant-gradientBright disabled:hover:to-adamant-gradientDark flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
