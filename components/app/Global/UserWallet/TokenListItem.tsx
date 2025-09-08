import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { ConfigToken } from '@/config/tokens';
import { DEFAULT_BALANCE_STATE, useBalanceFetcherStore } from '@/store/balanceFetcherStore';
import { useViewingKeyModalStore } from '@/store/viewingKeyModalStore';
import { isPricingEnabled } from '@/utils/features';
import { showToastOnce } from '@/utils/toast/toastManager';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useState } from 'react';
import { RiFileCopyLine, RiKeyLine, RiMoreLine } from 'react-icons/ri';
import TokenPriceDisplay from './TokenPriceDisplay';
import WalletBalance from './WalletBalance';

interface TokenListItemProps {
  token: ConfigToken;
}

export const TokenListItem = ({ token }: TokenListItemProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const balanceState = useBalanceFetcherStore(
    (state) => state.balances[token.address] ?? DEFAULT_BALANCE_STATE
  );
  const openViewingKeyModal = useViewingKeyModalStore((state) => state.open);

  // Determine viewing key status
  const hasViewingKeyError = balanceState.needsViewingKey || balanceState.error;
  const hasValidViewingKey = !hasViewingKeyError && balanceState.balance !== '-';

  const handleCopyViewingKey = async () => {
    try {
      if (!window.keplr) {
        showToastOnce('keplr-not-found', 'Keplr wallet not found', 'error');
        return;
      }

      const viewingKey = await window.keplr.getSecret20ViewingKey('secret-4', token.address);
      if (viewingKey) {
        await navigator.clipboard.writeText(viewingKey);
        showToastOnce(`viewing-key-copied-${token.address}`, 'Viewing Key Copied', 'success', {
          message: `${token.symbol} viewing key copied to clipboard`,
          autoClose: 2000,
        });
      } else {
        showToastOnce('no-viewing-key', 'No viewing key found', 'warning');
      }
    } catch (error) {
      console.error('Failed to copy viewing key:', error);
      showToastOnce('copy-failed', 'Failed to copy viewing key', 'error');
    }
    setIsMenuOpen(false);
  };

  const handleFixViewingKey = () => {
    openViewingKeyModal(token, 'wallet-menu');
    setIsMenuOpen(false);
  };

  return (
    <div className="group flex justify-between items-center hover:bg-white hover:bg-opacity-5 py-3 pl-6 transition-all duration-200">
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
        <TokenImageWithFallback
          tokenAddress={token.address}
          size={40}
          alt={token.symbol}
          className="rounded-lg flex-shrink-0"
        />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-white group-hover:text-white transition-colors text-base">
            {token.symbol}
          </span>
          <span className="text-sm text-adamant-text-box-secondary leading-tight">
            {token.name}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex flex-col items-end gap-1 relative">
          <div className="flex items-center gap-2">
            <WalletBalance
              tokenAddress={token.address}
              tokenSymbol={token.symbol}
              className="text-right"
            />
            {/* Inline copy icon for valid viewing keys */}
            {hasValidViewingKey && (
              <button
                onClick={() => void handleCopyViewingKey()}
                className="hidden group-hover:block transition-opacity duration-200 p-1 hover:bg-adamant-box-dark/50 rounded text-adamant-gradientBright hover:text-white"
                title="Copy viewing key"
              >
                <RiFileCopyLine className="w-3 h-3" />
              </button>
            )}
          </div>
          {isPricingEnabled() && (
            <TokenPriceDisplay coingeckoId={token.coingeckoId} className="text-right" />
          )}
        </div>

        {/* Three dots menu - fixed width container, only show when there are viewing key issues */}
        <div className="w-8 flex justify-center">
          {hasViewingKeyError && (
            <DropdownMenu.Root open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
              <DropdownMenu.Trigger asChild>
                <button
                  className="p-2 rounded-lg hover:bg-adamant-box-dark/50 text-adamant-text-box-secondary hover:text-white transition-all duration-200 hidden group-hover:block"
                  title="Token options"
                >
                  <RiMoreLine className="w-4 h-4" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[180px] bg-adamant-box-dark border border-adamant-box-border rounded-lg shadow-xl p-1"
                  sideOffset={5}
                  align="end"
                  data-wallet-dropdown="true"
                >
                  {/* Only show dropdown for "Fix Viewing Key" when needed */}
                  {hasViewingKeyError && (
                    <DropdownMenu.Item
                      className="flex items-center gap-3 px-3 py-2 text-sm text-orange-400 hover:text-orange-300 hover:bg-adamant-box-regular rounded-md cursor-pointer transition-colors outline-none"
                      onSelect={handleFixViewingKey}
                    >
                      <RiKeyLine className="w-4 h-4 text-orange-400" />
                      Fix Viewing Key
                    </DropdownMenu.Item>
                  )}

                  {/* Future menu items can be added here */}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>
      </div>
    </div>
  );
};
