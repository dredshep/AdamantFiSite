/**
 * CoinGecko API Service for fetching cryptocurrency prices
 *
 * This service handles all interactions with the CoinGecko API for price data.
 * It includes rate limiting, error handling, and caching mechanisms.
 */

export interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

export interface TokenPriceInfo {
  price: number;
  change24h?: number;
  lastUpdated: number;
}

export interface CoinGeckoError {
  error: string;
  status?: number;
}

// Cache interface for storing price data
interface PriceCache {
  [coinId: string]: {
    data: TokenPriceInfo;
    timestamp: number;
  };
}

class CoinGeckoService {
  private readonly cache: PriceCache = {};
  private readonly cacheTimeout = 300000; // 5 minutes cache to match server cache
  private readonly requestQueue: Map<string, Promise<TokenPriceInfo | null>> = new Map();
  private readonly multiRequestQueue: Map<string, Promise<Record<string, TokenPriceInfo | null>>> =
    new Map();

  // Rate limiting
  private lastRequestTime = 0;
  private readonly minRequestInterval = 1000; // 1 second between requests

  /**
   * Rate limiting helper
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(coinId: string): boolean {
    const cached = this.cache[coinId];
    if (!cached) return false;

    const now = Date.now();
    return now - cached.timestamp < this.cacheTimeout;
  }

  /**
   * Get cached price data
   */
  private getCachedPrice(coinId: string): TokenPriceInfo | null {
    if (this.isCacheValid(coinId)) {
      return this.cache[coinId]!.data;
    }
    return null;
  }

  /**
   * Cache price data
   */
  private setCachedPrice(coinId: string, data: TokenPriceInfo): void {
    this.cache[coinId] = {
      data,
      timestamp: Date.now(),
    };
  }

  /**
   * Fetch price for a single token by CoinGecko ID
   */
  async getTokenPrice(coinId: string): Promise<TokenPriceInfo | null> {
    // Check cache first
    const cached = this.getCachedPrice(coinId);
    if (cached) {
      return cached;
    }

    // Check if request is already in progress
    const existingRequest = this.requestQueue.get(coinId);
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request
    const request = this.fetchTokenPrice(coinId);
    this.requestQueue.set(coinId, request);

    try {
      const result = await request;
      return result;
    } finally {
      this.requestQueue.delete(coinId);
    }
  }

  /**
   * Internal method to fetch price from API
   */
  private async fetchTokenPrice(coinId: string): Promise<TokenPriceInfo | null> {
    try {
      await this.waitForRateLimit();

      // Use our secure proxy endpoint
      const url = `/api/prices?ids=${encodeURIComponent(coinId)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'AdamantFi-App/1.0',
        },
      });

      if (!response.ok) {
        console.error(`Pricing API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = (await response.json()) as CoinGeckoPriceResponse;

      const coinData = data[coinId];
      if (!coinData) {
        console.warn(`No price data found for coin ID: ${coinId}`);
        return null;
      }

      const priceInfo: TokenPriceInfo = {
        price: coinData.usd,
        change24h: coinData.usd_24h_change ?? 0,
        lastUpdated: Date.now(),
      };

      // Cache the result
      this.setCachedPrice(coinId, priceInfo);

      return priceInfo;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return null;
    }
  }

  /**
   * Fetch prices for multiple tokens at once (more efficient)
   */
  async getMultipleTokenPrices(coinIds: string[]): Promise<Record<string, TokenPriceInfo | null>> {
    if (coinIds.length === 0) return {};

    // Create a cache key for this specific request
    const requestKey = coinIds.sort().join(',');

    // Check if an identical request is already in progress
    const existingRequest = this.multiRequestQueue.get(requestKey);
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request and add to queue
    const request = this.processMultipleTokenPrices(coinIds);
    this.multiRequestQueue.set(requestKey, request);

    try {
      const result = await request;
      return result;
    } finally {
      this.multiRequestQueue.delete(requestKey);
    }
  }

  /**
   * Internal method to process multiple token price requests
   */
  private async processMultipleTokenPrices(
    coinIds: string[]
  ): Promise<Record<string, TokenPriceInfo | null>> {
    // Check cache for all coins and separate cached vs uncached
    const result: Record<string, TokenPriceInfo | null> = {};
    const uncachedIds: string[] = [];

    for (const coinId of coinIds) {
      const cached = this.getCachedPrice(coinId);
      if (cached) {
        result[coinId] = cached;
      } else {
        uncachedIds.push(coinId);
      }
    }

    // If all are cached, return immediately
    if (uncachedIds.length === 0) {
      return result;
    }

    // Fetch uncached prices in batches (CoinGecko allows up to 250 IDs per request)
    const batchSize = 100; // Conservative batch size
    for (let i = 0; i < uncachedIds.length; i += batchSize) {
      const batch = uncachedIds.slice(i, i + batchSize);
      const batchResults = await this.fetchMultipleTokenPrices(batch);

      // Merge batch results
      Object.assign(result, batchResults);
    }

    return result;
  }

  /**
   * Internal method to fetch multiple prices from API
   */
  private async fetchMultipleTokenPrices(
    coinIds: string[]
  ): Promise<Record<string, TokenPriceInfo | null>> {
    const result: Record<string, TokenPriceInfo | null> = {};

    try {
      await this.waitForRateLimit();

      // Use our secure proxy endpoint
      const idsParam = coinIds.join(',');
      const url = `/api/prices?ids=${encodeURIComponent(idsParam)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'AdamantFi-App/1.0',
        },
      });

      if (!response.ok) {
        console.error(`Pricing API error: ${response.status} ${response.statusText}`);
        // Fill result with nulls for failed requests
        coinIds.forEach((coinId) => {
          result[coinId] = null;
        });
        return result;
      }

      const data = (await response.json()) as CoinGeckoPriceResponse;

      // Process each requested coin ID
      coinIds.forEach((coinId) => {
        const coinData = data[coinId];
        if (coinData) {
          const priceInfo: TokenPriceInfo = {
            price: coinData.usd,
            change24h: coinData.usd_24h_change ?? 0,
            lastUpdated: Date.now(),
          };

          // Cache the result
          this.setCachedPrice(coinId, priceInfo);
          result[coinId] = priceInfo;
        } else {
          result[coinId] = null;
        }
      });

      return result;
    } catch (error) {
      console.error('Error fetching multiple token prices:', error);
      // Fill result with nulls for failed requests
      coinIds.forEach((coinId) => {
        result[coinId] = null;
      });
      return result;
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    Object.keys(this.cache).forEach((key) => {
      delete this.cache[key];
    });
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { totalEntries: number; validEntries: number } {
    const totalEntries = Object.keys(this.cache).length;
    let validEntries = 0;

    Object.keys(this.cache).forEach((coinId) => {
      if (this.isCacheValid(coinId)) {
        validEntries++;
      }
    });

    return { totalEntries, validEntries };
  }
}

// Export singleton instance
export const coingeckoService = new CoinGeckoService();

// Export the class for testing or custom instances
export { CoinGeckoService };
