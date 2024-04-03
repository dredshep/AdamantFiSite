import { FaSearch } from "react-icons/fa";

export default function TokenSelectionSearchBar({
  searchTerm,
  setSearchTerm,
}: {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <div className="mt-6 px-6">
      <div className="flex items-center bg-adamant-app-input h-12 px-4 rounded-xl">
        <FaSearch className="h-[18px] w-[18px] text-white text-opacity-25" />
        <input
          type="text"
          placeholder="Search or paste a token address"
          className="bg-transparent p-2 w-full focus:outline-none text-base placeholder-white placeholder-opacity-25"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
}
