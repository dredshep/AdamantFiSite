import React from "react";
import PlaceholderFromHexAddress from "./PlaceholderFromHexAddress";
import { RxCaretDown } from "react-icons/rx";
import { HexString } from "@/types";

interface TokenInputProps {
  userAddress: HexString;
}

const TokenInput: React.FC<TokenInputProps> = ({ userAddress }) => {
  return (
    <div className="flex">
      <input
        className="rounded-l-xl text-2xl font-bold py-2 px-[21px] bg-adamant-app-input w-full"
        placeholder="0.0"
      />
      <div className="flex items-center px-4 bg-adamant-app-input text-sm font-bold text-gray-500">
        0.0
      </div>
      <button className="bg-adamant-app-input text-sm font-bold text-white px-4">
        MAX
      </button>
      <div className="flex gap-3 items-center rounded-r-xl text-sm font-bold py-3 px-4 bg-adamant-app-selectTrigger min-w-48">
        <PlaceholderFromHexAddress userAddress={userAddress} size={24} />
        SCRT
        <RxCaretDown className="text-white h-5 w-5 ml-auto" />
      </div>
    </div>
  );
};

export default TokenInput;
