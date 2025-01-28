import { Pair, PairsResponse } from '@/types/api/Factory';
import { SecretNetworkClient } from 'secretjs';

let cachedPairs: Pair[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request debouncing - holds the in-flight promise if there is one
let currentRequest: Promise<Pair[]> | null = null;

// TODO: have a single client somewhere to import instead.
const secretjs = new SecretNetworkClient({
  url: 'https://rpc.ankr.com/http/scrt_cosmos',
  chainId: 'secret-4',
});

// Original implementation kept intact
async function _queryFactoryPairs() {
  if (cachedPairs && cacheTimestamp !== null && Date.now() - cacheTimestamp < CACHE_DURATION) {
    console.log('Returning cached pairs.');
    return cachedPairs;
  }

  // FIXME: hardcoded address
  const { pairs }: PairsResponse = await secretjs.query.compute.queryContract({
    contract_address: 'secret1tvzu9v3jvh4yvprxntatp9hg06kmdev40g5fna',
    code_hash: '16ea6dca596d2e5e6eef41df6dc26a1368adaa238aa93f07959841e7968c51bd',
    query: { pairs: { limit: 100 } },
  });

  console.log(`Got ${pairs.length} pairs.`);

  cachedPairs = pairs;
  cacheTimestamp = Date.now();

  return pairs;
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
