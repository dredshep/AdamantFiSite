import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

interface FinancialTableSearchBarProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
}

const FinancialTableSearchBar: React.FC<FinancialTableSearchBarProps> = ({
  placeholder,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <div className={`
      flex items-center bg-adamant-app-filterBg rounded-xl w-full transition-all duration-200 ease-in-out
      border hover:bg-adamant-app-filterBg/80 
      ${isFocused 
        ? 'border-adamant-gradientBright/40 bg-adamant-app-filterBg/90' 
        : 'border-adamant-box-inputBorder hover:border-adamant-gradientBright/30'
      }
    `}>
      <FaSearch className={`
        mx-4 transition-colors duration-200 ease-in-out
        ${isFocused ? 'text-adamant-gradientBright' : 'text-gray-500 hover:text-gray-400'}
      `} />
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleSearchChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full py-2 bg-transparent text-white placeholder-gray-400 outline-none"
      />
    </div>
  );
};

export default FinancialTableSearchBar;
