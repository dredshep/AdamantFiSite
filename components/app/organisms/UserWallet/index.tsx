// UserWallet.tsx
import React, { useEffect } from "react";
import { RxCaretDown } from "react-icons/rx";
import PlaceholderImageFromSeed from "@/components/app/molecules/PlaceholderImageFromSeed";
import keplrConnect from "@/utils/wallet/keplrConnect";
import { useStore } from "@/store/swapStore";
import keplrDisconnect from "@/utils/wallet/keplrDisconnect";
import { useModalStore } from "@/store/modalStore";
import WalletModal from "./WalletModal";

interface UserWalletProps {
  // isConnected: boolean;
  // userAddress: SecretString;
  // balanceSCRT: number;
  // balanceADMT: number;
  // onConnect: () => void;
}

const UserWallet: React.FC<UserWalletProps> = (
  {
    // isConnected,
    // userAddress,
    // balanceSCRT,
    // balanceADMT,
    // onConnect,
  }
) => {
  const { connectionRefused } = useStore();
  const { openWalletModal, isWalletModalOpen } = useModalStore();
  const {
    wallet: { address: userAddress, ADMTBalance, SCRTBalance },
  } = useStore();
  const truncatedAddress =
    userAddress === null
      ? ""
      : userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
  const isConnected = userAddress !== null;
  useEffect(() => {
    if (!connectionRefused) {
      keplrConnect();
    }
  }, [connectionRefused]);

  return (
    <div className="flex items-center gap-4 select-none cursor-pointer">
      {isConnected ? (
        <div
          className="flex gap-4 hover:bg-white hover:bg-opacity-5 px-6 py-3 rounded-lg transition-all duration-100"
          onClick={() => isConnected && openWalletModal()}
        >
          <div className="relative" onClick={() => keplrDisconnect()}>
            <PlaceholderImageFromSeed seed={userAddress} size={48} />
          </div>
          <div>
            <div className="hidden md:flex font-medium items-center gap-2">
              {truncatedAddress}
              <RxCaretDown className="text-white h-5 w-5" />
            </div>
            <div className="hidden md:block font-normal opacity-50">
              {SCRTBalance} SCRT / {ADMTBalance} ADMT
            </div>
          </div>
          <WalletModal />
        </div>
      ) : (
        <button
          onClick={() => keplrConnect()}
          className="text-black bg-white px-8 pt-2 pb-2 rounded-lg font-bold leading-6 fle hover:bg-adamant-accentBg transition-all ease-in-out"
        >
          CONNECT
        </button>
      )}
    </div>
  );
};

export default UserWallet;
