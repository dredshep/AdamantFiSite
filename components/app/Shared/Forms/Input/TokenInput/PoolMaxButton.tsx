import { usePoolDepositForm } from "@/hooks/usePoolDepositForm";
import { PoolTokenInputs } from "@/types";

interface PoolMaxButtonProps {
  poolInputIdentifier: keyof PoolTokenInputs;
}

const PoolMaxButton: React.FC<PoolMaxButtonProps> = ({
  poolInputIdentifier: inputIdentifier,
}) => {
  // const { setMax } = usePoolStore();
  const { setMax } = usePoolDepositForm();

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
