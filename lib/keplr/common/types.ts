/**
 * Common types for Secret Network contract interactions
 */

/**
 * Information about a Secret Network contract
 */
export interface ContractInfo {
  address: string;
  code_hash: string;
}

/**
 * Response containing a balance value
 */
export interface BalanceResponse {
  balance: string;
}

/**
 * Response containing rewards information
 */
export interface RewardsResponse {
  rewards: string;
}
