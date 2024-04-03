export default function InputBalanceAffordance({
  balance,
}: {
  balance: number;
}) {
  return (
    <div className="flex items-center px-4 bg-adamant-app-input text-sm font-bold text-gray-500">
      {balance.toFixed(2)}
    </div>
  );
}
