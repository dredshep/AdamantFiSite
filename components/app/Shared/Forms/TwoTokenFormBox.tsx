// Import necessary hooks and components
import React, { useState } from "react";
// import SwapForm from "@/components/app/Pages/Swap/SwapForm/SwapForm";
import cn from "classnames";
import AddLiquidityPrompt from "@/components/app/Shared/AddLiquidityText";
import TabTriangle from "@/components/app/Shared/TabTriangle";

interface Tab {
  label: string;
  Component: React.FC;
}

// const tabs: Tab[] = [
//   { label: "SWAP", Component: SwapForm },
//   { label: "SEND", Component: SwapForm },
// ];

type TwoTokenFormBoxProps = {
  tabs: Tab[];
  liquidityPrompt?: boolean;
};
const TwoTokenFormBox: React.FC<TwoTokenFormBoxProps> = ({
  tabs,
  liquidityPrompt,
}) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.label ?? "");

  return (
    <>
      <div className="flex gap-4 justify-between leading-6 px-5">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <div
              key={tab.label}
              className={cn("flex flex-col relative cursor-pointer", {
                "font-bold": activeTab === tab.label,
                "font-medium": activeTab !== tab.label,
                "brightness-50": activeTab !== tab.label,
              })}
              onClick={() => setActiveTab(tab.label)}
            >
              {tab.label}
              {activeTab === tab.label && <TabTriangle />}
            </div>
          ))}
        </div>
        {/* Placeholder for additional info related to selected tokens */}

        {typeof liquidityPrompt === "boolean" && <AddLiquidityPrompt />}
      </div>
      <div className="bg-adamant-app-box leading-none rounded-xl text-xl uppercase mt-2">
        {tabs.find((tab) => tab.label === activeTab)?.Component({})}
      </div>
    </>
  );
};

export default TwoTokenFormBox;
