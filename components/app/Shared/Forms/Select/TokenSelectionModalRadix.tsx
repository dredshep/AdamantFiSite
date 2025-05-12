import TokenSelectionItem from '@/components/app/Shared/Forms/Select/TokenSelectionItem';
import TokenSelectionSearchBar from '@/components/app/Shared/Forms/Select/TokenSelectionModal/TokenSelectionSearchBar';
import { ConfigToken } from '@/config/tokens';
import { useSwapStore } from '@/store/swapStore';
import { SwapTokenInputs } from '@/types';
import { searchToken } from '@/utils/token/searchToken';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross1Icon } from '@radix-ui/react-icons'; // Assuming usage of Radix Icons for the X icon
import React, { useState } from 'react';

interface TokenSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputIdentifier: keyof SwapTokenInputs;
}

const TokenSelectionModal: React.FC<TokenSelectionModalProps> = ({ onClose, inputIdentifier }) => {
  const { setTokenInputProperty } = useSwapStore();
  const [searchTerm, setSearchTerm] = useState('');
  const tokens = useSwapStore((state) => state.swappableTokens) as ConfigToken[] | undefined;

  const handleTokenSelect = (selectedToken: ConfigToken) => {
    setTokenInputProperty(inputIdentifier, 'tokenAddress', selectedToken.address);
    onClose();
  };

  return (
    <>
      <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />

      <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-adamant-app-box  rounded-lg w-1/3 py-6 outline-none z-10 text-base font-medium normal-case">
        <div className="flex justify-between items-center px-6">
          <Dialog.Title className="text-lg leading-[21px] font-bold">Select a token</Dialog.Title>
          <Dialog.Close asChild>
            <button className="outline-none">
              <Cross1Icon className="" />
            </button>
          </Dialog.Close>
        </div>

        <TokenSelectionSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <div className="text-gray-500 font-medium text-sm mt-4 px-6">YOUR TOKENS</div>

        <div
          className="flex flex-col gap-2 overflow-y-auto max-h-64 mt-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {tokens
            ? searchToken(searchTerm, tokens).map((token, index) => (
                <TokenSelectionItem
                  token={token}
                  key={index}
                  handleTokenSelect={handleTokenSelect}
                />
              ))
            : 'No swappable tokens available. Check your internet connection.'}
        </div>
      </Dialog.Content>
    </>
  );
};

export default TokenSelectionModal;
