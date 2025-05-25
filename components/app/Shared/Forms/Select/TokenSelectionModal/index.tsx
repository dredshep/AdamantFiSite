import { ConfigToken } from '@/config/tokens';
import { useSwapStore } from '@/store/swapStore';
import { searchToken } from '@/utils/token/searchToken';
import * as Dialog from '@radix-ui/react-dialog';
import React, { useState } from 'react';
import { SwapInputIdentifier } from '../../Input/TokenInputBase';
import TokenSelectionItem from '../TokenSelectionItem';
import TokenSelectionSearchBar from './TokenSelectionSearchBar';

interface TokenSelectionModalProps {
  inputIdentifier: SwapInputIdentifier;
}

const TokenSelectionModal: React.FC<TokenSelectionModalProps> = ({ inputIdentifier }) => {
  const { setTokenInputProperty, getAvailableTokensForInput } = useSwapStore();
  const [searchTerm, setSearchTerm] = useState('');
  const tokens = getAvailableTokensForInput(inputIdentifier);

  const handleTokenSelect = (selectedToken: ConfigToken) => {
    setTokenInputProperty(inputIdentifier, 'tokenAddress', selectedToken.address);
  };
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
      <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#202033] bg-opacity-95 rounded-lg w-1/3 py-6 max-w-md min-h-[300px] text-white z-20">
        <div className="flex justify-between items-center px-6">
          <Dialog.Title className="text-lg leading-[21px]">Select a token</Dialog.Title>
          <Dialog.Close asChild>Close</Dialog.Close>
        </div>
        <TokenSelectionSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <div className="text-gray-500 font-medium text-sm mt-4 px-6 uppercase">Your Tokens</div>
        <div
          className="flex flex-col gap-2 overflow-y-auto max-h-96 mt-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {tokens.length > 0
            ? searchToken(searchTerm, tokens).map((token, index) => (
                <TokenSelectionItem
                  key={index}
                  token={token}
                  handleTokenSelect={handleTokenSelect}
                />
              ))
            : 'No swappable tokens available. Check your internet connection.'}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
};

export default TokenSelectionModal;
