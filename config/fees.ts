import { Fee } from '@/types/secretswap/factory';

/**
 * Standard pool fee for SecretSwap pools (0.3%)
 */
export const POOL_FEE: Fee = {
  // meaning 0.3%
  commission_rate_nom: '3',
  commission_rate_denom: '1000',
};

/**
 * Standard SCRT blockchain transaction fee
 */
export const SCRT_TX_FEE = 0.0001;

/**
 * Gas limits for different transaction types
 */
export const GAS_LIMITS = {
  DIRECT_SWAP: 400_000,
  MULTIHOP_BASE: 150_000,
  MULTIHOP_PER_HOP: 400_000,
  MAX_MULTIHOP: 1_200_000,
} as const;

/**
 * Estimated gas price in uscrt per gas unit (Secret Network typically uses ~0.1 uscrt/gas)
 */
export const GAS_PRICE_USCRT = 0.1;

/**
 * Direct swap transaction fee for UI display (estimated based on gas limit and price)
 */
export const DIRECT_SWAP_FEE = (GAS_LIMITS.DIRECT_SWAP * GAS_PRICE_USCRT) / 1_000_000; // Convert to SCRT

/**
 * Multihop swap transaction fee per hop for UI display
 */
export const MULTIHOP_SWAP_FEE_PER_HOP =
  (GAS_LIMITS.MULTIHOP_PER_HOP * GAS_PRICE_USCRT) / 1_000_000; // Convert to SCRT

/**
 * Staking transaction fee (based on actual transaction: AA20CD986813DC894D96752BBD50EEA445693CCFDD58E0FF495D9C2335D91DE6)
 */
export const STAKING_TX_FEE = 0.05; // 50,000 uscrt

/**
 * Helper function to convert Fee to decimal
 */
export const feeToDecimal = (fee: Fee): number => {
  return Number(fee.commission_rate_nom) / Number(fee.commission_rate_denom);
};
