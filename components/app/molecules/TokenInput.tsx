import React, { useState } from "react";
import { TokenInputs, useStore } from "@/store/swapStore"; // Adjust the import path as necessary
import PlaceholderFromHexAddress from "./PlaceholderFromHexAddress";
import { RxCaretDown } from "react-icons/rx";
import { Token } from "@/types";

interface TokenInputProps {
  inputIdentifier: keyof TokenInputs; // This prop specifies which token input state to interact with (e.g., "swap.pay")
  maxable?: boolean;
  balance: number; // Assuming balance is still passed as a prop
}

const tokens = [
  { symbol: "sSCRT", address: "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek" },
  { symbol: "SEFI", address: "secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt" },
  { symbol: "sAAVE", address: "secret1yxwnyk8htvvq25x2z87yj0r5tqpev452fk6h5h" },
] as Token[];

const TokenInput: React.FC<TokenInputProps> = ({
  inputIdentifier,
  maxable = false,
  balance,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { tokenInputs, setTokenInputProperty } = useStore();

  // Extracting the specific token input state based on the inputIdentifier
  const { token, amount } = tokenInputs[inputIdentifier];

  const handleTokenSelect = (selectedToken: Token) => {
    setTokenInputProperty(inputIdentifier, "token", selectedToken);
    setIsModalOpen(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const numValue = parseFloat(value);

    if (!isNaN(numValue) && numValue >= 0 && numValue <= balance) {
      setTokenInputProperty(inputIdentifier, "amount", value);
    } else if (value === "") {
      setTokenInputProperty(inputIdentifier, "amount", "");
    }
  };

  const handleMax = () => {
    setTokenInputProperty(inputIdentifier, "amount", balance.toString());
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
          <PlaceholderFromHexAddress userAddress={token.address} size={24} />
          {token.symbol}
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
