import { TOKENS } from "@/config/tokens";
import TokenImageWithFallback from "../../Shared/TokenImageWithFallback";

export default function TokenPill() {
    const selectedToken = TOKENS[2]
  return <div className="bg-adamant-box-dark rounded-lg p-2">
    <div className="flex items-center gap-2.5 bg-adamant-box-regular rounded-full p-2 max-w-max px-4">
        <TokenImageWithFallback tokenAddress={selectedToken!.address} size={24} />
        <span className="text-sm font-medium">{selectedToken!.symbol}</span>
    </div>

  </div>;
}