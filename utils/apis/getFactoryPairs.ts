import { FACTORY, TOKENS } from '@/config/tokens';
import { secretClient } from '@/hooks/useSecretNetwork';
import { Pair, PairsResponse } from '@/types/api/Factory';

let cachedPairs: Pair[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request debouncing - holds the in-flight promise if there is one
let currentRequest: Promise<Pair[]> | null = null;

// Original implementation kept intact
async function _queryFactoryPairs() {
  if (cachedPairs && cacheTimestamp !== null && Date.now() - cacheTimestamp < CACHE_DURATION) {
    console.log('Returning cached pairs.');
    return cachedPairs;
  }

  const { pairs }: PairsResponse = await secretClient.query.compute.queryContract({
    contract_address: FACTORY.contract_address,
    code_hash: FACTORY.code_hash,
    query: { pairs: { limit: 100 } },
  });

  console.log(`Got ${pairs.length} pairs.`);

  // Enrich pairs with token information from our config
  const enrichedPairs = pairs.map((pair) => {
    const token0Address = pair.asset_infos[0]?.token?.contract_addr;
    const token1Address = pair.asset_infos[1]?.token?.contract_addr;

    let token0;
    let token1;

    if (token0Address !== undefined && token0Address.length > 0) {
      token0 = TOKENS.find((token) => token.address === token0Address);
    }

    if (token1Address !== undefined && token1Address.length > 0) {
      token1 = TOKENS.find((token) => token.address === token1Address);
    }

    // Add token information to the pair
    return {
      ...pair,
      token0,
      token1,
    } as Pair; // Cast to Pair to ensure type compatibility
  });

  cachedPairs = enrichedPairs;
  cacheTimestamp = Date.now();

  return enrichedPairs;
}

// Resilient wrapper for handling RPC connection issues
export async function queryFactoryPairs(): Promise<Pair[]> {
  // If there's an in-flight request, return it
  if (currentRequest) {
    return currentRequest;
  }

  const MAX_ATTEMPTS = 3;

  // Create new request
  currentRequest = (async () => {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const result = await _queryFactoryPairs();
        currentRequest = null; // Clear the request cache on success
        return result;
      } catch (error) {
        const isLastAttempt = attempt === MAX_ATTEMPTS;
        const hasCache = cachedPairs !== null;

        // Log the error but don't break execution
        console.warn(`RPC attempt ${attempt}/${MAX_ATTEMPTS} failed:`, error);

        // On last attempt, return cached data if available or rethrow
        if (isLastAttempt) {
          currentRequest = null; // Clear the request cache on final failure
          if (hasCache && cachedPairs) {
            console.warn('RPC unreachable, falling back to cached data');
            return cachedPairs;
          }
          throw error;
        }

        // Wait before retry (1s, 2s)
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }

    // TypeScript safety (should never reach here)
    currentRequest = null;
    throw new Error('Unexpected execution path');
  })();

  return currentRequest;
}
