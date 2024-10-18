import React from "react";
import { useStore } from "@/store/swapStore";
import TokenInputBase from "@/components/app/Shared/Forms/Input/TokenInputBase";
import { TokenInputs } from "@/types";
import { useTokenStore } from "@/store/tokenStore";
// import TokenSelectionModal from "@/components/app/Shared/Forms/Select/TokenSelectionModal";
// import * as Dialog from "@radix-ui/react-dialog";

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
  // const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleInputChange = (value: string) => {
    setTokenInputProperty(inputIdentifier, "amount", value);
  };

  const handleMaxClick = () => {
    setTokenInputProperty(inputIdentifier, "amount", balance.toString());
  };

  return token ? (
    // <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
    <>
      <TokenInputBase
        inputIdentifier={inputIdentifier}
        inputValue={amount}
        onInputChange={handleInputChange}
        tokenSymbol={token.symbol}
        tokenAddress={token.address}
        balance={balance.toString()}
        onMaxClick={handleMaxClick}
        // onTokenSelect={() => setIsModalOpen(true)}
        showEstimatedPrice={true}
        estimatedPrice={`$${(
          parseFloat(amount) * parseFloat(token.usdPrice || "0")
        ).toFixed(2)}`}
      />
    </>
  ) : //{/* </Dialog.Root> */}
  null;
};

export default TokenInput;
