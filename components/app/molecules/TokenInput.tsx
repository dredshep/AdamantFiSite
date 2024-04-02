import React, { useState } from "react";
import PlaceholderFromHexAddress from "./PlaceholderFromHexAddress";
import { RxCaretDown } from "react-icons/rx";
import { HexString, Token } from "@/types";

interface TokenInputProps {
  maxable?: boolean;
  tokens: Token[];
  selectedToken: Token;
  setSelectedToken: React.Dispatch<React.SetStateAction<Token>>;
  balance: number; // Assuming balance is passed as a prop
  amount: string;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
}

const TokenInput: React.FC<TokenInputProps> = ({
  maxable = false,
  tokens,
  selectedToken,
  setSelectedToken,
  balance,
  amount,
  setAmount,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [amount, setAmount] = useState<string>("");

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setIsModalOpen(false);
    // Optionally reset amount on token change
    // setAmount("");
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const numValue = parseFloat(value);

    if (!isNaN(numValue) && numValue >= 0 && numValue <= balance) {
      setAmount(value);
    } else if (value === "") {
      setAmount("");
    }
  };

  const handleMax = () => {
    setAmount(balance.toString());
  };

  return (
    <div>
      <div className="flex">
        <input
          className="rounded-l-xl text-2xl font-bold py-2 px-[21px] bg-adamant-app-input w-full"
          placeholder="0.0"
          value={amount}
          onChange={handleChange}
        />
        <div className="flex items-center px-4 bg-adamant-app-input text-sm font-bold text-gray-500">
          {/* Display the current balance */}
          {balance.toFixed(2)}
        </div>
        {maxable && (
          <button
            className="bg-adamant-app-input text-sm font-bold text-white px-4"
            onClick={handleMax}
          >
            MAX
          </button>
        )}
        <div
          className="flex gap-3 items-center rounded-r-xl text-sm font-bold py-3 px-4 bg-adamant-app-selectTrigger min-w-48 cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <PlaceholderFromHexAddress
            userAddress={selectedToken.address}
            size={24}
          />
          {selectedToken.symbol}
          <RxCaretDown className="text-white h-5 w-5 ml-auto" />
        </div>
      </div>
      {isModalOpen && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-black py-3 rounded-lg">
            <ul>
              {tokens.map((token, index) => (
                <li
                  key={index}
                  className="cursor-pointer p-2 hover:bg-gray-900 px-4 text-white"
                  onClick={() => handleTokenSelect(token)}
                >
                  {token.symbol}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenInput;
