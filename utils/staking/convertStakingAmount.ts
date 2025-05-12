/**
 * Converts a human-readable amount to the raw amount used by contracts
 * based on the specified number of decimals.
 *
 * @param amount The human-readable amount as a string
 * @param decimals The number of decimal places for the token
 * @returns The amount in raw/base units as a string
 */
export function convertToRawAmount(amount: string, decimals: number): string {
  if (!amount || amount === '') return '0';

  // Handle potential parsing issues
  try {
    // Parse the amount as a decimal number
    const decimalAmount = parseFloat(amount);
    if (isNaN(decimalAmount)) return '0';

    // Multiply by 10^decimals and round to avoid floating-point precision issues
    const rawAmount = Math.round(decimalAmount * Math.pow(10, decimals));

    // Convert the result back to a string
    return rawAmount.toString();
  } catch (error) {
    console.error('Error converting amount to raw value:', error);
    return '0';
  }
}

/**
 * Converts a raw/base amount from contracts to a human-readable amount
 * based on the specified number of decimals.
 *
 * @param rawAmount The raw amount from the contract as a string
 * @param decimals The number of decimal places for the token
 * @param displayDecimals Optional number of decimals to show in the result (default: 6)
 * @returns The amount in human-readable format as a string
 */
export function convertToDisplayAmount(
  rawAmount: string,
  decimals: number,
  displayDecimals = 6
): string {
  if (!rawAmount || rawAmount === '') return '0';

  try {
    // Parse the raw amount
    const amount = parseInt(rawAmount, 10);
    if (isNaN(amount)) return '0';

    // Convert to human-readable format
    const displayAmount = amount / Math.pow(10, decimals);

    // Format with the specified number of decimal places
    return displayAmount.toFixed(displayDecimals);
  } catch (error) {
    console.error('Error converting raw amount to display value:', error);
    return '0';
  }
}

/**
 * Determines if an amount exceeds the available balance
 *
 * @param amount The amount to check
 * @param balance The available balance
 * @returns true if the amount exceeds balance, false otherwise
 */
export function amountExceedsBalance(amount: string, balance: string): boolean {
  if (!amount || amount === '') return false;
  if (!balance || balance === '') return true;

  try {
    const amountValue = parseFloat(amount);
    const balanceValue = parseFloat(balance);

    if (isNaN(amountValue) || isNaN(balanceValue)) return true;

    return amountValue > balanceValue;
  } catch (error) {
    console.error('Error comparing amount to balance:', error);
    return true;
  }
}
