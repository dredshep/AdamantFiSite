/**
 * Utility functions for formatting staking-related values
 */

/**
 * Format balance amounts with appropriate decimal places
 */
export function formatStakingBalance(value: string | number | null | undefined): string {
  if (!value || value === '0') return '0';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';

  // For very small numbers, show more decimals
  if (num < 0.001) return num.toFixed(8);

  // For normal numbers, show up to 6 decimals but remove trailing zeros
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  });
}

/**
 * Format USD values with currency symbol
 */
export function formatUsd(value: number | undefined | null): string {
  if (!value || isNaN(value)) return '$0.00';

  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number | undefined | null): string {
  if (!value || isNaN(value)) return '0%';
  return `${value.toFixed(2)}%`;
}

/**
 * Format APR with higher precision for small values
 */
export function formatApr(value: number | undefined | null): string {
  if (!value || isNaN(value)) return '0%';

  // For very small APR values, show more decimal places
  if (value < 1) {
    return `${value.toFixed(4)}%`;
  }

  return `${value.toFixed(2)}%`;
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 */
export function formatLargeNumber(value: number | undefined | null): string {
  if (!value || isNaN(value)) return '0';

  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }

  return formatStakingBalance(value);
}

/**
 * Convert raw amount (with decimals) to display amount
 */
export function convertRawToDisplay(rawAmount: string | number, decimals: number = 6): number {
  const amount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;
  return amount / Math.pow(10, decimals);
}

/**
 * Convert display amount to raw amount (with decimals)
 */
export function convertDisplayToRaw(displayAmount: string | number, decimals: number = 6): string {
  const amount = typeof displayAmount === 'string' ? parseFloat(displayAmount) : displayAmount;
  return Math.floor(amount * Math.pow(10, decimals)).toString();
}

/**
 * Format time duration in a human-readable way
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  }

  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  }

  const days = Math.floor(seconds / 86400);
  return `${days}d`;
}

/**
 * Format emission rate for display
 */
export function formatEmissionRate(ratePerBlock: number, decimals: number = 6): string {
  const rate = ratePerBlock / Math.pow(10, decimals);
  return formatStakingBalance(rate);
}
