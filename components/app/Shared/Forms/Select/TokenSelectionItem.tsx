import { Token } from "@/types";
import PlaceholderImageFromSeed from "@/components/app/Shared/PlaceholderImageFromSeed";
import * as Dialog from "@radix-ui/react-dialog";
import {
  getApiTokenAddress,
  getApiTokenSymbol,
} from "@/utils/apis/getSwappableTokens";
interface TokenSelectionItemProps {
  token: Token;
  network: string; // Assuming you can provide network information
  balance: string; // Assuming you have balance information as a string
  handleTokenSelect: (token: Token) => void;
}

const TokenSelectionItem: React.FC<TokenSelectionItemProps> = ({
  token,
  network,
  balance,
  handleTokenSelect,
}) => {
  return (
    <Dialog.Close onClick={() => handleTokenSelect(token)} asChild>
      <div className="flex justify-between items-center cursor-pointer hover:bg-adamant-app-boxHighlight py-2 rounded-xl mx-2 px-6">
        <PlaceholderImageFromSeed seed={getApiTokenAddress(token)} size={40} />
        <div className="flex-grow ml-3 flex flex-col">
          <span className="font-bold">{getApiTokenSymbol(token)}</span>
          <span className="text-gray-500 text-xs font-medium">{network}</span>
        </div>
        <span className="font-bold">{balance}</span>
      </div>
    </Dialog.Close>
  );
};

export default TokenSelectionItem;
