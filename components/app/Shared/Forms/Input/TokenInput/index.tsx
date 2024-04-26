import React from "react";
import { useStore } from "@/store/swapStore";
import PlaceholderImageFromSeed from "@/components/app/Shared/PlaceholderImageFromSeed";
import { RxCaretDown } from "react-icons/rx";
import { TokenInputs } from "@/types";
import TokenSelectionModal from "@/components/app/Shared/Forms/Select/TokenSelectionModal";
import TokenInputBaseInput from "@/components/app/Shared/Forms/Input/TokenInputBaseInput";
import MaxButton from "@/components/app/Shared/Forms/Input/TokenInput/MaxButton";
import InputBalanceAffordance from "./InputBalanceAffordance";
import * as Dialog from "@radix-ui/react-dialog";
import { useTokenStore } from "@/store/tokenStore";

interface TokenInputProps {
  inputIdentifier: keyof TokenInputs;
  maxable?: boolean;
  balance: number;
}

const TokenInput: React.FC<TokenInputProps> = ({
  inputIdentifier,
  maxable = false,
  balance,
}) => {
  const { tokenInputs, setTokenInputProperty } = useStore();
  const { tokenAddress, amount } = tokenInputs[inputIdentifier];
  const token = useTokenStore().tokens?.[tokenAddress];
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const numValue = parseFloat(value);

    if (!isNaN(numValue) && numValue >= 0 && numValue <= balance) {
      setTokenInputProperty(inputIdentifier, "amount", value);
    } else if (value === "") {
      setTokenInputProperty(inputIdentifier, "amount", "");
    }
  };

  const handleMax = () => {
    setTokenInputProperty(inputIdentifier, "amount", balance.toString());
  };

  return (
    token && (
      <Dialog.Root>
        <div className="flex">
          <TokenInputBaseInput amount={amount} handleChange={handleChange} />
          <InputBalanceAffordance balance={balance} />
          {maxable && <MaxButton onClick={handleMax} />}
          <Dialog.Trigger asChild>
            <div
              className="flex gap-3 items-center rounded-r-xl text-sm font-bold py-3 px-4 bg-adamant-app-selectTrigger min-w-48 cursor-pointer hover:bg-adamant-app-boxHighlight transition-colors duration-75"
              onClick={() => {
                setIsModalOpen(isModalOpen ? false : true);
                console.log({ isModalOpen });
              }}
            >
              <PlaceholderImageFromSeed seed={token.address} size={24} />
              {token.symbol}
              <RxCaretDown className="text-white h-5 w-5 ml-auto" />
            </div>
          </Dialog.Trigger>
        </div>
        <TokenSelectionModal
          inputIdentifier={inputIdentifier}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
          }}
        />
      </Dialog.Root>
    )
  );
};

export default TokenInput;
