import React from "react";
import { useWalletStore } from "@/store/walletStore";
import PlaceholderImageFromSeed from "@/components/app/Shared/PlaceholderImageFromSeed";
import {
  RiSettings3Line,
  RiArrowUpSLine,
  RiFileCopyLine,
} from "react-icons/ri";
import { toast } from "react-toastify"; // Assuming you're using react-toastify for notifications
import { useTokenStore } from "@/store/tokenStore";
import { useModalStore } from "@/store/modalStore";

const WalletModal: React.FC = () => {
  const { isWalletModalOpen, closeWalletModal } = useModalStore();
  const { address } = useWalletStore();
  const { listAllTokens, getTokenByAddress } = useTokenStore();
  const tokens = listAllTokens();
  const balance =
    getTokenByAddress("secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek")
      ?.balance || "N/A";
  const copyAddressToClipboard = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      toast.success("Address copied to clipboard!");
    });
  };
  const truncatedAddress =
    address === null ? "" : address.slice(0, 6) + "..." + address.slice(-4);

  // Placeholder function for settings modal
  const openSettingsModal = () => {
    // Placeholder functionality
    console.log("Open settings modal");
  };

  return (
    <div className="bg-adamant-box-veryDark rounded-lg shadow-md absolute top-2 right-2 w-[312px] h-[calc(100vh-16px)] z-10">
      <div className="flex items-center justify-between mb-4 p-6">
        <div className="flex items-center">
          <PlaceholderImageFromSeed
            seed={address || "secret1 no address"}
            size={48}
          />
          <div className="mx-3">
            <p className="font-bold">
              {truncatedAddress || "secret1 no address"}
            </p>
          </div>
          <RiFileCopyLine
            className="text-gray-500 p-1 w-6 h-6 rounded-full hover:bg-opacity-10 duration-150 transition-all hover:bg-white cursor-pointer text-base"
            onClick={copyAddressToClipboard}
          />
          <RiSettings3Line
            className="text-gray-500 p-1 w-6 h-6 rounded-full hover:bg-opacity-10 duration-150 transition-all hover:bg-white cursor-pointer"
            onClick={openSettingsModal}
          />
        </div>
        <RiArrowUpSLine
          className="text-gray-500 p-1 w-7 h-7 rounded-full hover:bg-opacity-10 duration-150 transition-all hover:bg-white cursor-pointer text-xl mb-0.5"
          onClick={closeWalletModal}
        />
      </div>
      <div className="my-8 px-6">
        <p className="text-lg font-semibold text-gray-500">Your balance</p>
        <p className="text-4xl font-bold top-1">${balance}</p>
      </div>
      <div className="px-6">
        <button className="w-full py-3 rounded-xl bg-adamant-accentBg text-black font-bold my-4 uppercase">
          Get Tokens
        </button>
      </div>
      <div>
        <p className="text-sm font-semibold mb-2 ml-6 uppercase text-gray-500">
          Tokens
        </p>
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
