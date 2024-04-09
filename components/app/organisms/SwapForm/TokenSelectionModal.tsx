import React, { useState } from "react";
import { useStore } from "@/store/swapStore";
import { Token, TokenInputs } from "@/types";
import { X } from "lucide-react";
import TokenSelectionItem from "@/components/app/molecules/TokenSelectionItem";
import TokenSelectionSearchBar from "../../atoms/Swap/TokenSelectionModal/TokenSelectionSearchBar";

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
    setTokenInputProperty(
      inputIdentifier,
      "tokenAddress",
      selectedToken.address
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 normal-case font-normal text-base">
      <div className="bg-adamant-app-box rounded-lg w-1/3 py-6">
        <div className="flex justify-between items-center px-6">
          <h2 className="text-lg leading-[21px]">Select a token</h2>
          <X onClick={onClose} className="cursor-pointer text-gray-400 w-4" />
        </div>
        <TokenSelectionSearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        {/* Recent tokens and tokens list will go here */}
        <div className="text-gray-500 font-medium text-sm mt-4 px-6">
          YOUR TOKENS
        </div>
        <div
          className="flex flex-col gap-2 overflow-y-auto max-h-64 mt-4"
          style={{ scrollbarWidth: "none" }}
        >
          {tokens
            ?.filter((token) =>
              token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((token, index) => (
              <TokenSelectionItem
                key={index}
                token={token}
                handleTokenSelect={handleTokenSelect}
                network="Ethereum" // Assuming network is Ethereum
                balance="0.00" // Assuming balance is 0.00
              />
            )) ||
            "No swappable tokens available. Check your internet connection."}
        </div>
      </div>
    </div>
  );
};

export default TokenSelectionModal;
