import { usePoolForm } from '@/hooks/usePoolForm/usePoolForm';
import { usePoolStore } from '@/store/forms/poolStore';
import { PoolTokenInputs } from '@/types';

interface PoolMaxButtonProps {
  poolInputIdentifier: keyof PoolTokenInputs;
}

const PoolMaxButton: React.FC<PoolMaxButtonProps> = ({ poolInputIdentifier: inputIdentifier }) => {
  const { selectedPool } = usePoolStore();
  const { setMax } = usePoolForm(selectedPool?.address);

  const handleMax = () => {
    setMax(inputIdentifier);
  };

  return (
    <button
      className="font-medium text-base flex items-center justify-center bg-white opacity-80 hover:opacity-100 text-black rounded-md px-2"
      onClick={handleMax}
    >
      max
    </button>
  );
};

export default PoolMaxButton;
