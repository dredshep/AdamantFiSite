// UserWallet.tsx
import React from "react";
import { RxCaretDown } from "react-icons/rx";
import PlaceholderImageFromSeed from "@/components/app/molecules/PlaceholderImageFromSeed";
import { SecretString } from "@/types";

interface UserWalletProps {
  isConnected: boolean;
  userAddress: SecretString;
  balanceSCRT: number;
  balanceADMT: number;
  onConnect: () => void;
}

const UserWallet: React.FC<UserWalletProps> = ({
  isConnected,
  userAddress,
  balanceSCRT,
  balanceADMT,
  onConnect,
}) => {
  const truncatedAddress =
    userAddress.slice(0, 6) + "..." + userAddress.slice(-4);

  return (
    <div className="flex items-center gap-4">
      {isConnected ? (
        <>
          <div className="relative">
            <PlaceholderImageFromSeed seed={userAddress} size={48} />
          </div>
          <div>
            <div className="hidden md:flex font-medium items-center gap-2">
              {truncatedAddress}
              <RxCaretDown className="text-white h-5 w-5" />
            </div>
            <div className="hidden md:block font-normal opacity-50">
              {balanceSCRT} SCRT / {balanceADMT} ADMT
            </div>
          </div>
        </>
      ) : (
        <button onClick={onConnect} className="text-white px-4 py-2 rounded">
          Connect
        </button>
      )}
    </div>
  );
};

export default UserWallet;
