import React, { useState } from "react";
import { FaCheck } from "react-icons/fa"; // Importing check icon
import { useStore } from "@/store/swapStore"; // Adjust the import path as necessary
import { StoreState } from "@/types";
import { RiPencilFill } from "react-icons/ri";

interface DynamicFieldProps {
  fieldIdentifier: keyof StoreState["sharedSettings"];
}

const DynamicField: React.FC<DynamicFieldProps> = ({ fieldIdentifier }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isValid, setIsValid] = useState(true); // State to track validity
  const fieldValue = useStore((state) => state.sharedSettings[fieldIdentifier]);
  const setSharedSetting = useStore((state) => state.setSharedSetting);

  const validateInput = (value: string): boolean => {
    const parsedValue = parseFloat(value);
    return !isNaN(parsedValue) && parsedValue >= 0; // Example validation: non-negative numbers
  };

  const handleEdit = () => {
    setInputValue(fieldValue.toString());
    setIsEditing(true);
    setIsValid(true); // Reset validity when starting to edit
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsValid(validateInput(e.target.value)); // Validate on every change
  };

  const handleSave = () => {
    if (validateInput(inputValue)) {
      setSharedSetting(fieldIdentifier, parseFloat(inputValue));
      setIsEditing(false);
    }
    // No action on invalid input, maybe provide feedback
  };

  return (
    <div className="flex items-center">
      {isEditing ? (
        <>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className={`rounded-l-md h-6 text-sm font-bold py-2 px-4 box-border bg-adamant-app-input outline-none hover:bg-adamant-app-selectTrigger focus:bg-adamant-app-selectTrigger w-16 selection:bg-adamant-dark outline-transparent ${
              !isValid ? "border-2 border-red-500 " : ""
            }`}
            autoFocus
          />
          <button
            onClick={handleSave}
            className="bg-adamant-dark h-6 w-6 flex items-center justify-center rounded-r-md text-white outline-none"
            disabled={!isValid}
          >
            <FaCheck className="text-xs" />
          </button>
        </>
      ) : (
        <>
          <span className="text-sm selection:bg-white selection:text-blue-800">
            {fieldValue}
          </span>
          <RiPencilFill
            onClick={handleEdit}
            className="cursor-pointer text-2xl transition-all duration-150 rounded-full hover:bg-white hover:bg-opacity-15 p-1 ml-2"
          />
        </>
      )}
    </div>
  );
};

export default DynamicField;
