import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { TablePool } from '@/types/api/TablePool';

interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validates if pools are properly configured in the LIQUIDITY_PAIRS configuration
 * @param pools Array of table pools to validate
 * @returns Array of validation results
 */
export const validatePools = (pools: TablePool[]): ValidationResult[] => {
  return pools.map((pool) => {
    // Check if the pool exists in the LIQUIDITY_PAIRS configuration
    const configuredPool = LIQUIDITY_PAIRS.find(
      (pair) => pair.pairContract === pool.contract_address
    );

    if (!configuredPool) {
      return {
        isValid: false,
        reason: 'Pool not found in configuration',
      };
    }

    // Additional validation could be done here if needed

    return {
      isValid: true,
    };
  });
};
