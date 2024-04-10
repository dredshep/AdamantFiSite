import React from "react";
import cn from "classnames";

// Define a type that allows for either a string or a React component
type CellContent = string | React.ReactNode;

interface FinancialDataCell {
  content: CellContent;
  minWidth?: string;
  modifier?: "positive" | "negative";
  bold?: boolean;
}

interface FinancialDataRowProps {
  cells: FinancialDataCell[];
}

const FinancialDataRow: React.FC<FinancialDataRowProps> = ({ cells }) => {
  return (
    <div className="flex items-center justify-between text-white w-full">
      {cells.map((cell, index) => (
        <div
          key={index}
          className={cn(
            "flex-1",
            { "text-green-500": cell.modifier === "positive" },
            { "text-red-500": cell.modifier === "negative" },
            { "font-bold": cell.bold },
            { "rounded-b-[10px]": index === cells.length - 1 }
          )}
          style={{ minWidth: cell.minWidth }}
        >
          {cell.content}
        </div>
      ))}
    </div>
  );
};

export default FinancialDataRow;
