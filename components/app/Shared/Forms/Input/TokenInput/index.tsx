import React from "react";
import { useSwapStore } from "@/store/swapStore";
import TokenInputBase from "@/components/app/Shared/Forms/Input/TokenInputBase";
import { PoolTokenInputs, SwapTokenInputs } from "@/types";
import { useTokenStore } from "@/store/tokenStore";
import { usePoolDepositForm } from "@/hooks/usePoolDepositForm";
import { usePoolStore } from "@/store/forms/poolStore";

type FormType = "swap" | "pool";
interface TokenInputProps {
  inputIdentifier: keyof SwapTokenInputs | keyof PoolTokenInputs;
  formType: FormType;
}

type TokenData = {
  tokenAddress: string;
  amount: string;
  balance: string;
};

// Type guard functions
const isSwapInput = (
  id: keyof SwapTokenInputs | keyof PoolTokenInputs
): id is keyof SwapTokenInputs => {
  return id.startsWith("swap.");
};

const isPoolInput = (
  id: keyof SwapTokenInputs | keyof PoolTokenInputs
): id is keyof PoolTokenInputs => {
  return id.startsWith("pool.");
};

const TokenInput: React.FC<TokenInputProps> = ({
  inputIdentifier,
  formType,
}) => {
  const { swapTokenInputs: swapTokenInputs, setTokenInputProperty } =
    useSwapStore();
  const { selectedPool } = usePoolStore();
  const { tokenInputs: poolTokenInputs, setTokenInputAmount } =
    usePoolDepositForm(selectedPool?.address);

  // Get typed token data
  const getTokenData = (): TokenData => {
    if (formType === "swap" && isSwapInput(inputIdentifier)) {
      const data = swapTokenInputs[inputIdentifier];
      return {
        tokenAddress: data.tokenAddress,
        amount: data.amount,
        balance: String(data.balance || "0"),
      };
    } else if (formType === "pool" && isPoolInput(inputIdentifier)) {
      const data = poolTokenInputs[inputIdentifier];
      return {
        tokenAddress: data.tokenAddress,
        amount: data.amount,
        balance: String(data.balance || "0"),
      };
    }
    throw new Error("Invalid input identifier");
  };

  const tokenData = getTokenData();
  const token = useTokenStore().tokens?.[tokenData.tokenAddress];

  const handleInputChange = (value: string) => {
    if (formType === "swap" && isSwapInput(inputIdentifier)) {
      setTokenInputProperty(inputIdentifier, "amount", value);
    } else {
      setTokenInputAmount(inputIdentifier as keyof PoolTokenInputs, value);
    }
  };

  const handleMaxClick = () => {
    const balanceStr = String(tokenData.balance);
    if (formType === "swap" && isSwapInput(inputIdentifier)) {
      setTokenInputProperty(inputIdentifier, "amount", balanceStr);
    } else {
      setTokenInputAmount(inputIdentifier as keyof PoolTokenInputs, balanceStr);
    }
  };

  if (!token) {
    return null;
  }

  const estimatedPrice = `$${(
    parseFloat(tokenData.amount || "0") * parseFloat(token.usdPrice ?? "0")
  ).toFixed(2)}`;

  return (
    <TokenInputBase
      swapInputIdentifier={inputIdentifier}
      inputValue={tokenData.amount}
      onInputChange={handleInputChange}
      tokenSymbol={token.symbol}
      tokenAddress={token.address}
      balance={tokenData.balance}
      onMaxClick={handleMaxClick}
      showEstimatedPrice={true}
      estimatedPrice={estimatedPrice}
      label={formType === "swap" ? "Swap" : "Pool"}
      hasMax={true}
    />
  );
};

export default TokenInput;
