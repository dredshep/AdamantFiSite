import classNames from 'classnames';

export default function TokenInputBaseInput({
  amount,
  handleChange,
}: {
  amount: string;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      className={classNames(
        'w-full bg-transparent text-2xl font-light outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-500/50',
        // "focus:bg-adamant-app-selectTrigger focus:bg-opacity-30",
        // "hover:bg-adamant-app-selectTrigger hover:bg-opacity-30",
        'py-2',
        // "px-[21px]",
        'bg-transparent'
      )}
      placeholder="0.0"
      value={amount}
      onChange={handleChange}
    />
  );
}
