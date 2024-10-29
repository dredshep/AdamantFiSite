import React from "react";
import { FiCheckCircle, FiAlertTriangle, FiAlertOctagon } from "react-icons/fi";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

// Props for each SwapResultItem
interface SwapResultItemProps {
  label: string;
  value: string;
  tooltipId: string;
  tooltipContent: string;
  valueClassName?: string;
  icon?: JSX.Element | undefined;
}

// SwapResultItem functional component
const SwapResultItem: React.FC<SwapResultItemProps> = ({
  label,
  value,
  tooltipId,
  tooltipContent,
  valueClassName,
  icon,
}) => {
  return (
    <div className="flex justify-between items-center gap-8">
      <span
        className="text-md font-semibold text-gray-400 border-b leading-[18px] border-gray-600 hover:border-gray-500 cursor-help"
        data-tooltip-id={tooltipId}
      >
        {label}:
      </span>
      <div className="flex items-center">
        <span
          className={`text-lg font-bold ${valueClassName}`}
          // data-tooltip-id={tooltipId} // Apply the tooltip to the value text
        >
          {value}
        </span>
        {icon !== undefined &&
          React.cloneElement(icon, { "data-tooltip-id": tooltipId })}
        {/* Apply the tooltip to the icon */}
      </div>
      <Tooltip id={tooltipId} place="top" content={tooltipContent} />
    </div>
  );
};

// Main SwapResult component
interface SwapResultProps {
  bestRoute: string;
  idealOutput: string;
  actualOutput: string;
  priceImpact: string;
  lpFee: string;
  gasCost: string;
  isMultiHop: boolean;
  difference: string;
}

const SwapResult: React.FC<SwapResultProps> = ({
  bestRoute,
  idealOutput,
  actualOutput,
  priceImpact,
  lpFee,
  gasCost,
  isMultiHop,
  difference,
}) => {
  // Array to store the data and config for each section
  const data = [
    {
      label: "Best Route",
      value: bestRoute,
      tooltipId: "bestRouteTip",
      tooltipContent:
        "The optimal route for swapping your tokens to minimize slippage and maximize output.",
      valueClassName: "text-blue-400",
    },
    {
      label: "Ideal Output",
      value: idealOutput,
      tooltipId: "idealOutputTip",
      tooltipContent:
        "The best possible output you could get without any fees or slippage.",
      valueClassName: "text-blue-400",
    },
    {
      label: "Actual Output",
      value: actualOutput,
      tooltipId: "actualOutputTip",
      tooltipContent:
        "The actual amount of tokens you received after fees and slippage.",
      valueClassName: "text-green-400",
    },
    {
      label: "Difference",
      value: difference,
      tooltipId: "differenceTip",
      tooltipContent:
        "The difference between the ideal and actual output, caused by fees and slippage.",
      valueClassName: "text-red-400",
    },
    {
      label: "Price Impact",
      value: priceImpact,
      tooltipId: "priceImpactTip",
      tooltipContent:
        "The effect your trade has on the market price of the token pair.",
      valueClassName: priceImpactColor(priceImpact),
      icon: priceImpactIcon(priceImpact),
    },
    {
      label: "LP Fee",
      value: lpFee,
      tooltipId: "lpFeeTip",
      tooltipContent:
        "The fee paid to liquidity providers for facilitating your trade.",
      valueClassName: "text-yellow-300",
    },
    {
      label: "Gas Cost",
      value: gasCost,
      tooltipId: "gasCostTip",
      tooltipContent: isMultiHop
        ? "This gas cost includes multiple hops. Each hop incurs a separate gas fee. The total gas cost is the sum of all hops."
        : "This gas cost covers a single swap between two tokens in one liquidity pool.",
      valueClassName: "text-gray-300",
      icon: <FiCheckCircle className="ml-2 w-5 h-5 cursor-help" />, // Removed tooltipId here, will be added dynamically
    },
  ];

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-md text-white space-y-4 max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-green-400">Swap Estimate</h2>
      </div>
      <div className="flex flex-col space-y-2">
        {data.map((item, index) => (
          <SwapResultItem
            key={index}
            label={item.label}
            value={item.value}
            tooltipId={item.tooltipId}
            tooltipContent={item.tooltipContent}
            valueClassName={item.valueClassName}
            icon={item.icon}
          />
        ))}
      </div>
    </div>
  );
};

// Utility functions for dynamic styling
const priceImpactColor = (priceImpact: string) => {
  const impact = parseFloat(priceImpact);
  if (impact < 1) return "text-green-400";
  if (impact < 3) return "text-yellow-400";
  return "text-red-400";
};

const priceImpactIcon = (priceImpact: string) => {
  const impact = parseFloat(priceImpact);
  if (impact < 1.1) return <FiCheckCircle className="ml-2 w-5 h-5" />;
  if (impact < 3) return <FiAlertTriangle className="ml-2 w-5 h-5" />;
  return <FiAlertOctagon className="ml-2 w-5 h-5" />;
};

export default SwapResult;
