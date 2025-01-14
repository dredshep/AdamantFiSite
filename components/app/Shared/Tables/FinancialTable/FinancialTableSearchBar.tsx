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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="flex items-center bg-adamant-box-dark rounded-xl w-full focus-within:brightness-125 hover:brightness-125 transition-all duration-200">
      <FaSearch className="mx-4 text-gray-500 transition-colors duration-200 ease-in-out" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleSearchChange}
        className="w-full py-2 bg-adamant-box-dark rounded-xl text-white placeholder-gray-400 outline-none "
      />
    </div>
  );
};

export default FinancialTableSearchBar;
