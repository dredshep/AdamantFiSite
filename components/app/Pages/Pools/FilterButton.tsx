interface FilterButtonProps {
  icon: 'dollar' | 'native';
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const FilterButton = ({ icon, label, isActive, onClick }: FilterButtonProps) => {
  const icons = {
    dollar: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    native: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19.5 12l-7.5 7.5-7.5-7.5M12 4.5v15m7.5-7.5l-7.5-7.5-7.5 7.5"
        />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
  };

  return (
    <button
      className={`
        px-4 py-3 border-2 rounded-lg font-semibold 
        flex gap-2 items-center relative transition-all duration-300
        ${
          isActive
            ? 'border-gray-300 text-gray-100 bg-gradient-to-br from-gray-600 to-gray-700 shadow-inner shadow-gray-900/50'
            : 'border-gray-600 text-gray-400 bg-gradient-to-br from-gray-700 to-gray-800 hover:border-gray-500 hover:text-gray-300'
        }
        transform hover:scale-[1.02]
      `}
      onClick={onClick}
    >
      {icons[icon]}
      <span>{label}</span>
    </button>
  );
};

export default FilterButton;
