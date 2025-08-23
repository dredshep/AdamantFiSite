import { SecretString } from '@/types';

export interface TokenImageConfig {
  address: SecretString;
  imagePath: string;
  hasCustomImage: boolean;
}

// Available optimized sizes
const AVAILABLE_SIZES = [24, 32, 40, 48, 64];

/**
 * Get the best matching optimized size for a requested size
 */
function getBestOptimizedSize(requestedSize: number): number {
  // Find the smallest available size that's >= requested size
  const exactOrLarger = AVAILABLE_SIZES.find((size) => size >= requestedSize);
  if (exactOrLarger) return exactOrLarger;

  // If no larger size available, use the largest available
  return AVAILABLE_SIZES[AVAILABLE_SIZES.length - 1] ?? 32;
}

/**
 * Configuration for token images
 * Maps token addresses to their corresponding PNG files in /public/images/tokens/
 */
export const TOKEN_IMAGES: TokenImageConfig[] = [
  // Main tokens with optimized PNG images
  {
    address: 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek', // sSCRT
    imagePath: 'sSCRT.png',
    hasCustomImage: true,
  },
  {
    address: 'secret19e75l25r6sa6nhdf4lggjmgpw0vmpfvsw5cnpe', // sATOM
    imagePath: 'ATOM.png',
    hasCustomImage: true,
  },
  {
    address: 'secret1fl449muk5yq8dlad7a22nje4p5d2pnsgymhjfd', // SILK
    imagePath: 'SILK.png',
    hasCustomImage: true,
  },
  {
    address: 'secret139qfh3nmuzfgwsx2npnmnjl4hrvj3xq5rmq8a0', // ETH.axl
    imagePath: 'ETH.png',
    hasCustomImage: true,
  },
  {
    address: 'secret1chsejpk9kfj4vt9ec6xvyguw539gsdtr775us2', // USDC.nbl
    imagePath: 'USDC.png',
    hasCustomImage: true,
  },
  {
    address: 'secret1sgaz455pmtgld6dequqayrdseq8vy2fc48n8y3', // JKL
    imagePath: 'JKL.png',
    hasCustomImage: true,
  },
  {
    address: 'secret1cu5gvrvu24hm36fzyq46vca7u25llrymj6ntek', // bADMT
    imagePath: 'bADMT.png',
    hasCustomImage: true,
  },
  {
    address: 'uscrt' as SecretString, // uSCRT (native token)
    imagePath: 'sSCRT.png',
    hasCustomImage: true,
  },
  // Staking contract images (not optimized, kept as-is)
  {
    address: 'secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev',
    imagePath: '/images/tokens/secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev.svg',
    hasCustomImage: true,
  },
  // Dummy tokens for testing dual icon display (not optimized, kept as-is)
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
];

/**
 * Get the image path for a given token address with size optimization
 * Returns the custom image path if available, otherwise null for fallback to placeholder
 */
export function getTokenImagePath(tokenAddress: SecretString, size?: number): string | null {
  const tokenImage = TOKEN_IMAGES.find((img) => img.address === tokenAddress);

  if (!tokenImage?.hasCustomImage) {
    return null;
  }

  const imagePath = tokenImage.imagePath;

  // If it's already a full path (starts with /), return as-is (for SVGs and legacy paths)
  if (imagePath.startsWith('/')) {
    return imagePath;
  }

  // For optimized PNG images, use size-specific directory
  if (size && imagePath.endsWith('.png')) {
    const optimizedSize = getBestOptimizedSize(size);
    return `/images/tokens/optimized/${optimizedSize}/${imagePath}`;
  }

  // Fallback to 32px for PNG images when no size specified
  if (imagePath.endsWith('.png')) {
    return `/images/tokens/optimized/32/${imagePath}`;
  }

  // For non-PNG files, use the original path structure
  return `/images/tokens/${imagePath}`;
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
