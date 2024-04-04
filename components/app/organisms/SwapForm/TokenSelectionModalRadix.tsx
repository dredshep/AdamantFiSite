import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross1Icon } from "@radix-ui/react-icons"; // Assuming usage of Radix Icons for the X icon
import TokenSelectionItem from "@/components/app/molecules/TokenSelectionItem";
import TokenSelectionSearchBar from "@/components/app/atoms/Swap/TokenSelectionModal/TokenSelectionSearchBar";
import { useStore } from "@/store/swapStore";
import { Token, TokenInputs } from "@/types";

interface TokenSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputIdentifier: keyof TokenInputs;
}

const TokenSelectionModal: React.FC<TokenSelectionModalProps> = ({
  isOpen,
  onClose,
  inputIdentifier,
}) => {
  const { setTokenInputProperty } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const tokens = useStore((state) => state.swappableTokens);

  const handleTokenSelect = (selectedToken: Token) => {
    setTokenInputProperty(inputIdentifier, "token", selectedToken);
    onClose();
  };

  return (
    <>
      <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />

      <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-adamant-app-box rounded-lg w-1/3 py-6 outline-none z-10 text-base font-medium normal-case">
        <div className="flex justify-between items-center px-6">
          <Dialog.Title className="text-lg leading-[21px] font-bold">
            Select a token
          </Dialog.Title>
          <Dialog.Close asChild>
            <button className="outline-none">
              <Cross1Icon className="" />
            </button>
          </Dialog.Close>
        </div>

        <TokenSelectionSearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <div className="text-gray-500 font-medium text-sm mt-4 px-6">
          YOUR TOKENS
        </div>

        <div
          className="flex flex-col gap-2 overflow-y-auto max-h-64 mt-4"
          style={{ scrollbarWidth: "none" }}
        >
          {tokens
            .filter((token) =>
              token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((token, index) => (
              // <Dialog.Close asChild key={index}>
              <TokenSelectionItem
                token={token}
                key={index}
                handleTokenSelect={handleTokenSelect}
                network="Ethereum" // Assuming network is Ethereum
                balance="0.00" // Assuming balance is 0.00
              />
              // {/* </Dialog.Close> */}
            ))}
        </div>
      </Dialog.Content>
    </>
  );
};

export default TokenSelectionModal;
