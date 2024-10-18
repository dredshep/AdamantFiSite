import { usePoolStore } from "@/store/forms/poolStore";

interface PoolMaxButtonProps {
  inputIdentifier: string;
}

const PoolMaxButton: React.FC<PoolMaxButtonProps> = ({ inputIdentifier }) => {
  const { setMax } = usePoolStore();

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
