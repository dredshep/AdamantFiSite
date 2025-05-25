import React from 'react';

interface StakingPoolSelectionSearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const StakingPoolSelectionSearchBar: React.FC<StakingPoolSelectionSearchBarProps> = ({
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search pools..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-adamant-app-input/60 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-adamant-accentText/50 border border-adamant-box-border hover:bg-adamant-app-input/80 transition-all placeholder:text-gray-500"
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  );
};

export default StakingPoolSelectionSearchBar;
