interface TableHeaderProps {
  headers: Array<{
    title: string;
    minWidth?: string; // Optional min-width for each column
  }>;
}

const TableHeaders: React.FC<TableHeaderProps> = ({ headers }) => {
  return (
    <div className="flex text-xs text-gray-500 uppercase bg-adamant-app-box dark:bg-gray-700 dark:text-gray-400 py-3 px-6">
      {headers.map((header, index) => (
        <div
          key={index}
          className={`flex-1 ${
            header.minWidth ? `min-w-[${header.minWidth}]` : ""
          }`}
          style={{ minWidth: header.minWidth }} // Apply min-width if provided
        >
          {header.title}
        </div>
      ))}
    </div>
  );
};

export default TableHeaders;
