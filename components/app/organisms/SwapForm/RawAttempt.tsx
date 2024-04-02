import { useState } from "react";
import { Token } from "@/types";
import SwapForm from "@/components/app/organisms/SwapForm/index";

// Dummy token array
const tokens = [
  { symbol: "ETH", address: "0xETHasdasfasdasdsadasdasd" },
  { symbol: "DAI", address: "0xDAIasdasdsdadasd" },
  { symbol: "USDC", address: "0xUSDCasddsaasasdadd" },
] as Token[];

export default function RawAttempt() {
  const [payToken, setPayToken] = useState(tokens[0]);
  const [receiveToken, setReceiveToken] = useState(tokens[1]);
  const [payAmount, setPayAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");

  const handleSwapClick = () => {
    alert(
      `Paying with: ${payToken.symbol}, Receiving: ${receiveToken.symbol}, Amounts: ${payAmount}, ${receiveAmount}`
    );
  };

  return (
    <SwapForm
      tokens={tokens}
      payToken={payToken}
      receiveToken={receiveToken}
      payAmount={payAmount}
      receiveAmount={receiveAmount}
      setPayToken={setPayToken}
      setReceiveToken={setReceiveToken}
      setPayAmount={setPayAmount}
      setReceiveAmount={setReceiveAmount}
      handleSwapClick={handleSwapClick}
    />
  );
}
