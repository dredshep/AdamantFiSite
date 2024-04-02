interface AmountInputProps {
  amount: string;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  balance: number; // Assuming there's a balance you want to check against
}

const AmountInput: React.FC<AmountInputProps> = ({
  amount,
  setAmount,
  balance,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const numValue = parseFloat(value);

    // Check if it's a number, not negative, and doesn't exceed the balance
    if (!isNaN(numValue) && numValue >= 0 && numValue <= balance) {
      setAmount(value);
    } else if (value === "") {
      // Allow clearing the input
      setAmount("");
    }
    // Implicitly, if the conditions are not met, do not update the state (i.e., ignore the input)
  };

  return (
    <input
      type="text" // Using type="text" to handle inputs like "0." without immediate conversion to number
      value={amount}
      onChange={handleChange}
      className="rounded-xl text-sm font-bold py-2 px-4 bg-adamant-app-input w-full"
      placeholder="Enter amount"
    />
  );
};

export default AmountInput;
