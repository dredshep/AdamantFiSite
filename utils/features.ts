/**
 * Feature flags for the application
 * These allow certain features to be enabled/disabled via environment variables
 */

/**
 * Check if pricing features are enabled
 * This includes:
 * - Price displays in wallet
 * - CoinGecko API calls
 * - Total wallet value calculations
 *
 * @returns true if pricing is enabled, false otherwise
 */
export function isPricingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PRICING?.toLowerCase() === 'true';
}

/**
 * Get all available feature flags and their status
 * Useful for debugging and admin panels
 */
export function getFeatureFlags(): Record<string, boolean> {
  return {
    pricing: isPricingEnabled(),
  };
}








