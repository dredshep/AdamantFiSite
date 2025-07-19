import cn from 'classnames';
interface TableHeaderProps {
  headers: Array<{
    title: string;
    minWidth?: '20px' | '40px' | '60px' | '80px' | '120px' | '160px' | '240px'; // Optional min-width for each column
    align?: 'start' | 'center' | 'end'; // Optional alignment for each column
  }>;
}

const TableHeaders: React.FC<TableHeaderProps> = ({ headers }) => {
  return (
    <div className="flex text-[15px] leading-5 text-white bg-adamant-app-selectTrigger py-3 px-6 rounded-t-[10px]">
      {headers.map((header, index) => (
        <div
          key={index}
          // className={`flex-1 ${
          //   header.minWidth ? `min-w-[${header.minWidth}]` : ""
          // }`}
          className={cn({
            'flex-1': true,
            'min-w-[240px]': header.minWidth === '240px',
            'min-w-[160px]': header.minWidth === '160px',
            'min-w-[120px]': header.minWidth === '120px',
            'min-w-[80px]': header.minWidth === '80px',
            'min-w-[60px]': header.minWidth === '60px',
            'min-w-[40px]': header.minWidth === '40px',
            'min-w-[20px]': header.minWidth === '20px',
            'text-start': header.align === 'start',
            'text-center': header.align === 'center',
            'text-end': header.align === 'end',
          })}
          style={{ minWidth: header.minWidth }} // Apply min-width if provided
        >
          {header.title}
        </div>
      ))}
    </div>
  );
};

export default TableHeaders;
