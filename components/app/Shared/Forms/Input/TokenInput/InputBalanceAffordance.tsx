export default function InputBalanceAffordance({
  balance,
}: {
  balance: number;
}) {
  return (
    <div className="flex gap-1 items-center px-4 bg-adamant-app-input text-sm font-bold text-gray-500">
      <div className="mt-[3px] text-xs">≈</div>
      <div>{balance.toFixed(2)}</div>
    </div>
  );
}
