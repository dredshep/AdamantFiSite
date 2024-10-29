import { useSwapStore } from "@/store/swapStore";

interface MaxButtonProps {
  inputIdentifier: "swap.pay" | "swap.receive";
  balance: number;
}

const MaxButton: React.FC<MaxButtonProps> = ({ inputIdentifier, balance }) => {
  const { setTokenInputProperty } = useSwapStore();

  const handleMax = () => {
    setTokenInputProperty(inputIdentifier, "amount", balance.toString());
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

export default MaxButton;
