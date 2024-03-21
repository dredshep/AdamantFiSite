import ImageWithPlaceholder from "./ImageWithPlaceholder";
import addressTo3Colors from "@/utils/ImageWithPlaceholder/addressTo3Colors";
import { HexString } from "@/types";
import stringToHex from "@/utils/ImageWithPlaceholder/stringToHex";
import { RxCaretDown } from "react-icons/rx";

interface UserWalletProps {
  isConnected: boolean;
  userAddress: HexString;
  balanceSCRT: number;
  balanceADMT: number;
  onConnect: () => void;
}

function UserWallet({
  isConnected,
  userAddress,
  balanceSCRT,
  balanceADMT,
  onConnect,
}: UserWalletProps) {
  const truncatedAddress =
    userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
  const hexAddress = stringToHex(userAddress);
  const colorsString = addressTo3Colors(hexAddress);
  const placeholderUrl = `https://api.dicebear.com/6.x/shapes/svg?seed=${hexAddress}&height=24&width=24&${colorsString}`;
  return (
    <div className="flex items-center gap-4">
      {isConnected ? (
        <>
          <div className="relative">
            <ImageWithPlaceholder
              imageUrl={placeholderUrl}
              placeholderUrl={placeholderUrl}
              index={1}
              length={2}
              alt="Avatar"
            />
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
}

export default UserWallet;
