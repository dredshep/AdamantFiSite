import classNames from "classnames";

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
        "rounded-l-xl text-2xl font-light w-full outline-none ",
        // "focus:bg-adamant-app-selectTrigger focus:bg-opacity-30",
        // "hover:bg-adamant-app-selectTrigger hover:bg-opacity-30",
        "py-2",
        // "px-[21px]",
        "bg-transparent"
      )}
      placeholder="0.0"
      value={amount}
      onChange={handleChange}
    />
  );
}
