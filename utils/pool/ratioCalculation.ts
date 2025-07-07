import Decimal from 'decimal.js';

export interface PoolReserves {
  token0: {
    address: string;
    amount: Decimal;
    decimals: number;
  };
  token1: {
    address: string;
    amount: Decimal;
    decimals: number;
  };
}

export interface ProportionalAmountResult {
  amount: string;
  isValid: boolean;
  error?: string;
}

/**
 * Calculate the proportional amount of the second token based on the first token amount
 * and the current pool reserves ratio
 */
export function calculateProportionalAmount(
  inputAmount: string,
  inputTokenAddress: string,
  reserves: PoolReserves
): ProportionalAmountResult {
  try {
    // Validate input amount
    if (!inputAmount || inputAmount.trim() === '' || inputAmount === '0') {
      return {
        amount: '0',
        isValid: true,
      };
    }

    const inputAmountDecimal = new Decimal(inputAmount);
    if (inputAmountDecimal.isNaN() || inputAmountDecimal.isNegative()) {
      return {
        amount: '0',
        isValid: false,
        error: 'Invalid input amount',
      };
    }

    // Check if we have valid reserves (zero liquidity case)
    if (reserves.token0.amount.isZero() || reserves.token1.amount.isZero()) {
      // For pools with no liquidity, return 0 but mark as valid
      // This allows users to provide initial liquidity at any ratio
      return {
        amount: '0',
        isValid: true,
      };
    }

    // Determine which token is the input and which is the output
    const isToken0Input = inputTokenAddress === reserves.token0.address;

    if (!isToken0Input && inputTokenAddress !== reserves.token1.address) {
      return {
        amount: '0',
        isValid: false,
        error: 'Token not found in pool',
      };
    }

    // Convert reserves to display format (divide by 10^decimals)
    const token0Reserve = reserves.token0.amount.div(Decimal.pow(10, reserves.token0.decimals));
    const token1Reserve = reserves.token1.amount.div(Decimal.pow(10, reserves.token1.decimals));

    let outputAmount: Decimal;

    if (isToken0Input) {
      // Input is token0, calculate token1 amount
      // token1_amount = (token0_amount * token1_reserve) / token0_reserve
      outputAmount = inputAmountDecimal.mul(token1Reserve).div(token0Reserve);
    } else {
      // Input is token1, calculate token0 amount
      // token0_amount = (token1_amount * token0_reserve) / token1_reserve
      outputAmount = inputAmountDecimal.mul(token0Reserve).div(token1Reserve);
    }

    // Format to 6 decimal places (standard for most tokens)
    const formattedAmount = outputAmount.toFixed(6);

    return {
      amount: formattedAmount,
      isValid: true,
    };
  } catch (_error) {
    return {
      amount: '0',
      isValid: true,
      error: _error instanceof Error ? _error.message : 'Calculation error',
    };
  }
}

/**
 * Convert pool reserves from the API response format to our internal format
 */
export function convertPoolReservesToFormat(
  poolData: {
    assets: Array<{
      info: {
        token: {
          contract_addr: string;
        };
      };
      amount: string;
    }>;
  },
  token0Address: string,
  token1Address: string
): PoolReserves | null {
  try {
    if (!poolData.assets || poolData.assets.length !== 2) {
      return null;
    }

    // Find the assets for each token
    const token0Asset = poolData.assets.find(
      (asset) => asset.info.token.contract_addr === token0Address
    );
    const token1Asset = poolData.assets.find(
      (asset) => asset.info.token.contract_addr === token1Address
    );

    if (!token0Asset || !token1Asset) {
      return null;
    }

    return {
      token0: {
        address: token0Address,
        amount: new Decimal(token0Asset.amount),
        decimals: 6, // Standard decimals for Secret Network tokens
      },
      token1: {
        address: token1Address,
        amount: new Decimal(token1Asset.amount),
        decimals: 6, // Standard decimals for Secret Network tokens
      },
    };
  } catch (_error) {
    return null;
  }
}
