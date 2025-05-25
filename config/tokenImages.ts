import { SecretString } from '@/types';

export interface TokenImageConfig {
  address: SecretString;
  imagePath: string;
  hasCustomImage: boolean;
}

/**
 * Configuration for token images
 * Maps token addresses to their corresponding SVG files in /public/images/tokens/
 */
export const TOKEN_IMAGES: TokenImageConfig[] = [
  // Staking contract images
  {
    address: 'secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev',
    imagePath: '/images/tokens/secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev.svg',
    hasCustomImage: true,
  },
  // Dummy tokens for testing dual icon display
  {
    address: 'dummy-token-1' as SecretString,
    imagePath: '/images/tokens/dummy-token-1.svg',
    hasCustomImage: true,
  },
  {
    address: 'dummy-token-2' as SecretString,
    imagePath: '/images/tokens/dummy-token-2.svg',
    hasCustomImage: true,
  },
  // Add more token images here as they become available
];

/**
 * Get the image path for a given token address
 * Returns the custom image path if available, otherwise null for fallback to placeholder
 */
export function getTokenImagePath(tokenAddress: SecretString): string | null {
  const tokenImage = TOKEN_IMAGES.find((img) => img.address === tokenAddress);
  return tokenImage?.hasCustomImage ? tokenImage.imagePath : null;
}

/**
 * Check if a token has a custom image available
 */
export function hasCustomTokenImage(tokenAddress: SecretString): boolean {
  const tokenImage = TOKEN_IMAGES.find((img) => img.address === tokenAddress);
  return tokenImage?.hasCustomImage ?? false;
}

/**
 * Get all tokens that have custom images
 */
export function getTokensWithCustomImages(): TokenImageConfig[] {
  return TOKEN_IMAGES.filter((img) => img.hasCustomImage);
}
