import { Roboto } from "next/font/google";
import AppLayout from "@/components/app/Global/AppLayout";
import SwapForm from "@/components/app/Pages/Swap/SwapForm/SwapForm";
// import { useStore } from "@/store/swapStore";
// import { useTokenStore } from "@/store/tokenStore";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

// Then render infoBoxes where you need it in your component tree.

export default function Swap() {
  // const { tokenInputs } = useStore();
  // const { tokens } = useTokenStore();
  // const receiveTokenAddress = tokenInputs["swap.receive"].tokenAddress;
  // const payTokenAddress = tokenInputs["swap.pay"].tokenAddress;
  // const receiveToken = tokens?.[receiveTokenAddress];
  // const payToken = tokens?.[payTokenAddress];
  return (
    <div
      className={
        roboto.className +
        " bg-tubeshapes-light bg-cover min-h-screen text-white"
      }
    >
      <AppLayout>
        <div className="max-w-xl mx-auto mt-28">
          {/* <div className="flex gap-4 justify-between leading-6 px-5">
            <div className="flex gap-4">
              <div className="font-bold flex flex-col relative">
                SWAP
                <div className="relative">
                  <div
                    className="w-0 h-0 absolute left-3
  border-l-[8px] border-l-transparent
  border-b-[8px] border-b-[#30364E]
  border-r-[8px] border-r-transparent"
                  ></div>
                </div>
              </div>
              <div className="brightness-50 font-medium">SEND</div>
            </div>
            {payToken && receiveToken ? (
              <div key={payToken.address + receiveToken.address}>
                + Add liquidity for {payToken.symbol} and {receiveToken.symbol}
              </div>
            ) : (
              <div>Loading tokens...</div>
            )}
          </div> */}
          <div className="bg-adamant-app-box bg-opacity-30 leading-none rounded-xl text-xl mt-2">
            <SwapForm />
          </div>
        </div>
      </AppLayout>
    </div>
  );
}
