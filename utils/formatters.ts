export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Truncates a Secret Network address to show first and last characters with ellipsis in the middle
 * @param address - The full Secret Network address (e.g., "secret1abc...xyz")
 * @param startChars - Number of characters to show at the start (default: 8)
 * @param endChars - Number of characters to show at the end (default: 6)
 * @returns Truncated address (e.g., "secret1a...xyz123")
 */
export const truncateAddress = (
  address: unknown,
  startChars: number = 8,
  endChars: number = 6
): string => {
  // Type guard to ensure we have a valid string
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    return typeof address === 'string' ? address : '';
  }

  // If address is shorter than total chars to show, return as-is
  if (address.length <= startChars + endChars + 3) {
    return address;
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Truncates an address and adds a visual indicator that it's copyable
 * @param address - The full Secret Network address
 * @param startChars - Number of characters to show at start (default: 8)
 * @param endChars - Number of characters to show at end (default: 6)
 * @returns Truncated address with copy indicator
 */
export const truncateAddressWithCopyHint = (
  address: unknown,
  startChars: number = 8,
  endChars: number = 6
): string => {
  const truncated = truncateAddress(address, startChars, endChars);
  // Add a subtle indicator that this is copyable
  return `📋 ${truncated}`;
};

/**
 * Stores the full address for later retrieval when copying
 * This is a simple in-memory store for the current session
 */
const addressStore = new Map<string, string>();

/**
 * Stores a full address and returns a truncated version with copy functionality
 * @param address - The full address to store and truncate
 * @param startChars - Characters to show at start
 * @param endChars - Characters to show at end
 * @returns Object with truncated display and copy function
 */
export const createCopyableAddressInfo = (
  address: string,
  startChars: number = 8,
  endChars: number = 6
): {
  display: string;
  fullAddress: string;
  copyToClipboard: () => Promise<boolean>;
} => {
  const truncated = truncateAddress(address, startChars, endChars);
  const displayText = `📋 ${truncated}`;

  // Store the full address
  addressStore.set(truncated, address);

  return {
    display: displayText,
    fullAddress: address,
    copyToClipboard: async (): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(address);
        return true;
      } catch (error) {
        console.error('Failed to copy address:', error);
        return false;
      }
    },
  };
};
