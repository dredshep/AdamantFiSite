import React from "react";
import { SecretString } from "@/types";
import PlaceholderImageFromSeed from "@/components/app/Shared/PlaceholderImageFromSeed";

interface TokenDisplayProps {
  seed: SecretString;
  name: string;
  // network: string;
}

const TokenDisplay: React.FC<TokenDisplayProps> = ({ seed, name }) => {
  return (
    <div className="flex-1 flex items-center min-w-60">
      <PlaceholderImageFromSeed seed={seed} size={24} />
      <div className="ml-3">
        <div className="font-bold text-white">{name}</div>
        {/* <div className="text-sm text-gray-400">{network}</div> */}
      </div>
    </div>
  );
};

export default TokenDisplay;
