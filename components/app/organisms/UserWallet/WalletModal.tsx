import React from "react";
import { useWalletStore } from "@/store/walletStore";
import PlaceholderImageFromSeed from "@/components/app/molecules/PlaceholderImageFromSeed";
import {
  RiSettings3Line,
  RiArrowUpSLine,
  RiFileCopyLine,
} from "react-icons/ri";
import { toast } from "react-toastify"; // Assuming you're using react-toastify for notifications
import { useTokenStore } from "@/store/tokenStore";
import { useModalStore } from "@/store/modalStore";

const WalletModal: React.FC = () => {
  const { closeWalletModal } = useModalStore();
  const { address } = useWalletStore();
  const { listAllTokens } = useTokenStore();
  const tokens = listAllTokens();
  const balance = tokens?.filter((token) => token.symbol === "ADMT")?.[0]
    ?.balance;
  const copyAddressToClipboard = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      toast.success("Address copied to clipboard!");
    });
  };

  // Placeholder function for settings modal
  const openSettingsModal = () => {
    // Placeholder functionality
    console.log("Open settings modal");
  };

  const hideWalletModal = () => {
    closeWalletModal();
  };

  return (
    <div className="bg-adamant-box-veryDark rounded-lg shadow-md p-6 absolute top-2 right-2 w-[312px] h-[calc(100vh-16px)] z-10">
      <div className="flex items-center justify-between mb-4">
        <PlaceholderImageFromSeed
          seed={address || "secret1 no address"}
          size={48}
        />
        <div className="flex-grow mx-3">
          <p className="font-bold">{address}</p>
        </div>
        <RiFileCopyLine
          className="text-gray-600 cursor-pointer"
          onClick={copyAddressToClipboard}
        />
        <RiSettings3Line
          className="text-gray-600 cursor-pointer ml-2"
          onClick={openSettingsModal}
        />
        <RiArrowUpSLine
          className="text-gray-600 cursor-pointer ml-2"
          onClick={hideWalletModal}
        />
      </div>
      <div className="text-center my-8">
        <p className="text-lg font-semibold">Your Balance</p>
        <p className="text-4xl font-bold">${balance}</p>
      </div>
      <button className="w-full py-3 rounded-lg bg-adamant-button-accent text-white font-bold my-4">
        Get Tokens
      </button>
      <div>
        <p className="text-lg font-semibold mb-2">Tokens</p>
        {tokens?.map((token, index) => (
          <div
            key={index}
            className="flex justify-between items-center cursor-pointer hover:bg-adamant-app-boxHighlight py-2 rounded-xl mx-2 px-6"
          >
            <PlaceholderImageFromSeed seed={token.address} size={40} />
            <div className="flex-grow ml-3 flex flex-col">
              <span className="font-bold">{token.symbol}</span>
              <span className="text-gray-500 text-xs font-medium">
                {token.network}
              </span>
            </div>
            <span className="font-bold">{token.balance}</span>
          </div>
        )) || (
          <p>
            Token store not correctly initialized. Check your internet
            connection or availability of the API server.
          </p>
        )}
      </div>
    </div>
  );
};

export default WalletModal;
