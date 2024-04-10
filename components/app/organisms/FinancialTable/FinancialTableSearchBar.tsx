import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";

interface FinancialTableSearchBarProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
}

const FinancialTableSearchBar: React.FC<FinancialTableSearchBarProps> = ({
  placeholder,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="flex items-center bg-adamant-box-dark rounded-xl w-full group">
      <FaSearch className="ml-4 text-gray-500 group-hover:text-gray-300 transition-colors duration-200 ease-in-out" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleSearchChange}
        className="w-full px-4 py-2 bg-adamant-box-dark rounded-xl pl-10 text-white placeholder-gray-400 outline-none hover:brightness-125 transition-all duration-200"
      />
    </div>
  );
};

export default FinancialTableSearchBar;
