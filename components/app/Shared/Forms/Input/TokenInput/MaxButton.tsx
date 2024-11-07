import { useSwapStore } from '@/store/swapStore';
import { SwapInputIdentifier } from '../TokenInputBase';

interface MaxButtonProps {
  inputIdentifier: SwapInputIdentifier;
  balance: number;
}

const SwapMaxButton: React.FC<MaxButtonProps> = ({ inputIdentifier, balance }) => {
  const { setTokenInputProperty } = useSwapStore();

  const handleMax = () => {
    setTokenInputProperty(inputIdentifier, 'amount', balance.toString());
  };

  return (
    <button
      className="font-medium text-base flex items-center justify-center bg-white opacity-80 hover:opacity-100 text-black rounded-md  px-2"
      onClick={handleMax}
    >
      max
    </button>
  );
};

export default SwapMaxButton;
