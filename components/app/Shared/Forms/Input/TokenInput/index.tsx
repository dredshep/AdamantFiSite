import React from "react";
import { useStore } from "@/store/swapStore";
import PlaceholderImageFromSeed from "@/components/app/Shared/PlaceholderImageFromSeed";
import { TokenInputs } from "@/types";
import TokenSelectionModal from "@/components/app/Shared/Forms/Select/TokenSelectionModal";
import TokenInputBaseInput from "@/components/app/Shared/Forms/Input/TokenInputBaseInput";
// import InputBalanceAffordance from "./InputBalanceAffordance";
import * as Dialog from "@radix-ui/react-dialog";
import { useTokenStore } from "@/store/tokenStore";

interface TokenInputProps {
  inputIdentifier: keyof TokenInputs;
  balance: number;
}

const TokenInput: React.FC<TokenInputProps> = ({
  inputIdentifier,
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

  return (
    token && (
      <Dialog.Root>
        <div className="flex">
          <TokenInputBaseInput amount={amount} handleChange={handleChange} />
          {/* <InputBalanceAffordance balance={balance} /> */}
          <Dialog.Trigger asChild>
            <div
              className="flex gap-3 items-center rounded-xl text-base font-medium py-1 px-3 bg-adamant-app-selectTrigger min-w-max cursor-pointer hover:bg-adamant-app-boxHighlight transition-colors duration-75 tracking-wide"
              onClick={() => {
                setIsModalOpen(isModalOpen ? false : true);
                console.log({ isModalOpen });
              }}
            >
              <PlaceholderImageFromSeed seed={token.address} size={24} />
              {token.symbol}
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
