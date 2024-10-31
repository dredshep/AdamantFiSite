import { TablePool } from "@/types";
import { Pair } from "@/types/api/Factory";
import { queryFactoryPairs } from "./getFactoryPairs";
import { ApiToken, getApiToken } from "./getSwappableTokens";

interface PoolValidationResult {
  isValid: boolean;
  reason: string | undefined;
}

interface ValidationContext {
  pairs: Pair[];
  tokens: ApiToken[];
}

// Separate function to validate a single pool with existing data
function validateSinglePool(
  pool: TablePool,
  context: ValidationContext
): PoolValidationResult {
  // Find the corresponding pair
  const pair = context.pairs.find(
    (p) => p.contract_addr === pool.contract_address
  );
  if (!pair) {
    return { isValid: false, reason: "Pool not found in factory pairs" };
  }

  // Check if pair has exactly 2 assets
  if (pair.asset_infos.length !== 2) {
    return { isValid: false, reason: "Pool does not have exactly 2 assets" };
  }

  // Check if both tokens exist in our token list
  const token0Address = pair.asset_infos[0]?.token?.contract_addr;
  const token1Address = pair.asset_infos[1]?.token?.contract_addr;

  if (token0Address === undefined || token1Address === undefined) {
    return { isValid: false, reason: "Missing token addresses" };
  }

  const token0 = context.tokens.find((t) => t.address === token0Address);
  const token1 = context.tokens.find((t) => t.address === token1Address);

  if (!token0 || !token1) {
    return {
      isValid: false,
      reason: "One or both tokens not found in token list",
    };
  }

  return { isValid: true, reason: undefined };
}

// Function to validate multiple pools at once
export async function validatePools(
  pools: TablePool[]
): Promise<PoolValidationResult[]> {
  try {
    // Fetch data once
    const [pairs, tokens] = await Promise.all([
      queryFactoryPairs(),
      getApiToken(),
    ]);

    const context: ValidationContext = { pairs, tokens };

    // Validate all pools using the same data
    return pools.map((pool) => validateSinglePool(pool, context));
  } catch (error) {
    // If there's an error fetching data, mark all pools as invalid
    return pools.map(() => ({
      isValid: false,
      reason: error instanceof Error ? error.message : "Unknown error occurred",
    }));
  }
}

// Keep this for backward compatibility if needed
export async function validatePool(
  pool: TablePool
): Promise<PoolValidationResult> {
  const results = await validatePools([pool]);
  return results[0] ?? { isValid: false, reason: "Validation failed" };
}
