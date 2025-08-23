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
 * Direct swap transaction fee (based on ~300k gas limit)
 */
export const DIRECT_SWAP_FEE = 0.03;

/**
 * Multihop swap transaction fee per hop (based on ~400k additional gas per hop)
 */
export const MULTIHOP_SWAP_FEE_PER_HOP = 0.0325;

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
