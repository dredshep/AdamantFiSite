import PlaceholderImageFromSeed from '@/components/app/Shared/PlaceholderImageFromSeed';
import { ConfigToken } from '@/config/tokens';
import * as Dialog from '@radix-ui/react-dialog';

interface TokenSelectionItemProps {
  token: ConfigToken;
  handleTokenSelect: (token: ConfigToken) => void;
}

const TokenSelectionItem: React.FC<TokenSelectionItemProps> = ({ token, handleTokenSelect }) => {
  return (
    <Dialog.Close onClick={() => handleTokenSelect(token)} asChild>
      <div className="flex justify-between items-center cursor-pointer hover:bg-adamant-app-boxHighlight py-2 rounded-xl mx-2 px-6">
        <PlaceholderImageFromSeed seed={token.address} size={40} />
        <div className="flex-grow ml-3 flex flex-col">
          <span className="font-bold">{token.symbol}</span>
          <span className="text-gray-500 text-xs font-medium">{token.name}</span>
        </div>
      </div>
    </Dialog.Close>
  );
};

export default TokenSelectionItem;
