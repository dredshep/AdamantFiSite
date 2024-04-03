import { Jura } from "next/font/google";
import AppLayout from "../../components/app/compositions/AppLayout";
import RawAttempt from "@/components/app/organisms/SwapForm/RawAttempt";

const jura = Jura({ subsets: ["latin"] });

// Then render infoBoxes where you need it in your component tree.

export default function Swap() {
  return (
    <div
      className={
        jura.className +
        " bg-tubeshapes-light bg-cover min-h-screen pb-20 text-white"
      }
    >
      <AppLayout>
        {/* container div simply setting max width and perhaps other settings for content only */}
        <div className="max-w-xl mx-auto mt-28">
          <div className="flex gap-4 justify-between leading-6 px-5">
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
            <div>+ Add liquidity for SRCT/SHD</div>
          </div>
          <div className="bg-adamant-app-box leading-none rounded-xl text-xl uppercase mt-2">
            <RawAttempt />
          </div>
        </div>
      </AppLayout>
    </div>
  );
}
