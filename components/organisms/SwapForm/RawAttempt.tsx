import ImageWithPlaceholder from "@/components/app/ImageWithPlaceholder";
import InputLabel from "@/components/app/atoms/InputLabel";
import PlaceholderFromHexAddress from "@/components/app/molecules/PlaceholderFromHexAddress";
import TokenInput from "@/components/app/molecules/TokenInput";
import Image from "next/image";
import { RxCaretDown } from "react-icons/rx";

export default function RawAttempt() {
  return (
    <div className="flex flex-col gap-6 pt-8">
      <div className="flex flex-col gap-6 px-8">
        <div className="flex flex-col gap-2">
          <InputLabel label="You Pay" caseType="uppercase" />

          <TokenInput userAddress="0xfirst token input" maxable />
        </div>
        <div className="flex flex-col gap-2">
          <InputLabel label="You Receive" caseType="uppercase" />
          <TokenInput userAddress="0xsecond token input" />
        </div>
        <div className="flex justify-between normal-case">
          <div className="flex items-center space-x-4">
            <InputLabel label="Slippage" caseType="normal-case" />
            <input
              className="rounded-xl text-sm font-bold py-2 px-4 bg-adamant-app-input w-20"
              placeholder="0.5%"
            />
          </div>
          <div className="flex items-center space-x-4 ">
            <InputLabel label="Est. gas:" caseType="normal-case" />
            <input
              className="rounded-xl text-sm font-bold py-2 px-4 bg-adamant-app-input w-20"
              placeholder="0.0"
            />
          </div>
        </div>
      </div>
      {/* SWAP button w accent bg, stuck to bottom, full w without padding*/}
      <button className="bg-adamant-accentBg text-lg rounded-b-xl text-black py-3 font-bold w-full">
        SWAP
      </button>
    </div>
  );
}
