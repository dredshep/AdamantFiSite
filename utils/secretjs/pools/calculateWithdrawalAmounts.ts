import { ConfigToken } from '@/config/tokens';

export interface WithdrawalCalculationInput {
  lpAmount: string; // Display amount (e.g., "0.1")
  totalLpSupply: string; // Raw amount from pool data
  asset0Amount: string; // Raw amount from pool data
  asset1Amount: string; // Raw amount from pool data
  token0: ConfigToken;
  token1: ConfigToken;
}

export interface WithdrawalCalculationResult {
  token0Amount: string; // Display amount
  token1Amount: string; // Display amount
  proportion: number; // Percentage of pool being withdrawn (0-1)
  isValid: boolean;
  error?: string;
}

/**
 * Calculate the amounts of underlying tokens that will be received when withdrawing LP tokens
 */
export function calculateWithdrawalAmounts(
  input: WithdrawalCalculationInput
): WithdrawalCalculationResult {
  const { lpAmount, totalLpSupply, asset0Amount, asset1Amount, token0, token1 } = input;

  // Validate inputs
  if (!lpAmount || parseFloat(lpAmount) <= 0) {
    return {
      token0Amount: '0',
      token1Amount: '0',
      proportion: 0,
      isValid: false,
      error: 'Invalid LP amount',
    };
  }

  if (!totalLpSupply || parseFloat(totalLpSupply) <= 0) {
    return {
      token0Amount: '0',
      token1Amount: '0',
      proportion: 0,
      isValid: false,
      error: 'Invalid total LP supply',
    };
  }

  if (!asset0Amount || !asset1Amount) {
    return {
      token0Amount: '0',
      token1Amount: '0',
      proportion: 0,
      isValid: false,
      error: 'Invalid asset amounts',
    };
  }

  try {
    // Convert LP amount from display format to raw format
    // LP tokens have 6 decimals
    const lpAmountRaw = parseFloat(lpAmount) * Math.pow(10, 6);
    const totalLpSupplyRaw = parseFloat(totalLpSupply);

    // Calculate proportion of pool being withdrawn
    const proportion = lpAmountRaw / totalLpSupplyRaw;

    if (!isFinite(proportion) || isNaN(proportion) || proportion < 0) {
      return {
        token0Amount: '0',
        token1Amount: '0',
        proportion: 0,
        isValid: false,
        error: 'Invalid proportion calculation',
      };
    }

    if (proportion > 1) {
      const totalLpSupplyDisplay = (totalLpSupplyRaw / Math.pow(10, 6)).toFixed(6);
      console.error(
        `❌ Cannot withdraw ${lpAmount} LP tokens. Total pool supply is only ${totalLpSupplyDisplay} LP tokens.`
      );
      return {
        token0Amount: '0',
        token1Amount: '0',
        proportion: 0,
        isValid: false,
        error: `Cannot withdraw ${lpAmount} LP tokens. Total pool supply is only ${totalLpSupplyDisplay} LP tokens.`,
      };
    }

    // Calculate raw amounts to be withdrawn
    const asset0AmountRaw = parseFloat(asset0Amount);
    const asset1AmountRaw = parseFloat(asset1Amount);

    const token0WithdrawRaw = asset0AmountRaw * proportion;
    const token1WithdrawRaw = asset1AmountRaw * proportion;

    // Convert to display format using token decimals
    const token0Amount = (token0WithdrawRaw / Math.pow(10, token0.decimals)).toFixed(6);
    const token1Amount = (token1WithdrawRaw / Math.pow(10, token1.decimals)).toFixed(6);

    // Validate final amounts
    if (isNaN(parseFloat(token0Amount)) || isNaN(parseFloat(token1Amount))) {
      return {
        token0Amount: '0',
        token1Amount: '0',
        proportion: 0,
        isValid: false,
        error: 'Invalid final amounts',
      };
    }

    return {
      token0Amount,
      token1Amount,
      proportion,
      isValid: true,
    };
  } catch (error) {
    return {
      token0Amount: '0',
      token1Amount: '0',
      proportion: 0,
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown calculation error',
    };
  }
}

/**
 * Format withdrawal amounts for display with proper precision
 */
export function formatWithdrawalAmounts(result: WithdrawalCalculationResult): {
  token0Display: string;
  token1Display: string;
  proportionDisplay: string;
} {
  if (!result.isValid) {
    return {
      token0Display: '0',
      token1Display: '0',
      proportionDisplay: '0%',
    };
  }

  // Remove trailing zeros and format nicely
  const token0Display = parseFloat(result.token0Amount).toString();
  const token1Display = parseFloat(result.token1Amount).toString();
  const proportionDisplay = (result.proportion * 100).toFixed(4) + '%';

  return {
    token0Display,
    token1Display,
    proportionDisplay,
  };
}
