// Types for LP Staking Contract interactions

/**
 * Secret contract interface
 * @remarks This old type uses contract_hash instead of code_hash
 */
interface SecretContract {
  address: string;
  contract_hash: string;
}

export enum LPStakingResponseStatus {
  Success = 'success',
  Failure = 'failure',
}

// ======== Execute Message Interfaces ========

/**
 * Redeem action allows users to claim accumulated rewards
 * and optionally withdraw staked LP tokens
 */
interface Redeem {
  redeem: {
    /**
     * Optional amount of LP tokens to withdraw (unstake)
     * If not provided, only pending rewards will be claimed
     * without affecting the staked position
     */
    amount?: string;
  };
}

/**
 * Create a viewing key for authenticated queries
 */
interface CreateViewingKey {
  create_viewing_key: {
    entropy: string;
    padding?: string;
  };
}

/**
 * Set a viewing key for authenticated queries
 */
interface SetViewingKey {
  set_viewing_key: {
    key: string;
    padding?: string;
  };
}

export type LPStakingExecuteMsg = Redeem | CreateViewingKey | SetViewingKey;

// ======== Receive Message Interfaces ========

/**
 * Deposit message used with SNIP20 Send
 * @note Send via SNIP20 'Send' message with attached 'msg'
 */
interface Deposit {
  deposit: Record<string, never>;
}

export type LPStakingReceiveMsg = Deposit;

// ======== Execute Response Interfaces ========

interface RedeemResponse {
  redeem: {
    status: LPStakingResponseStatus;
  };
}

interface CreateViewingKeyResponse {
  create_viewing_key: {
    key: string;
  };
}

interface SetViewingKeyResponse {
  set_viewing_key: {
    status: LPStakingResponseStatus;
  };
}

export type LPStakingExecuteAnswer =
  | RedeemResponse
  | CreateViewingKeyResponse
  | SetViewingKeyResponse;

// ======== Query Message Interfaces ========

interface TokenInfo {
  token_info: Record<string, never>;
}

interface Admin {
  admin: Record<string, never>;
}

interface ContractStatus {
  contract_status: Record<string, never>;
}

interface RewardToken {
  reward_token: Record<string, never>;
}

interface IncentivizedToken {
  incentivized_token: Record<string, never>;
}

interface TotalLocked {
  total_locked: Record<string, never>;
}

interface Subscribers {
  subscribers: Record<string, never>;
}

interface RewardSources {
  reward_sources: Record<string, never>;
}

// Authenticated Queries

interface Rewards {
  rewards: {
    address: string;
    key: string;
    height: number;
  };
}

interface Balance {
  balance: {
    address: string;
    key: string;
  };
}

export type LPStakingQueryMsg =
  | TokenInfo
  | Admin
  | ContractStatus
  | RewardToken
  | IncentivizedToken
  | TotalLocked
  | Subscribers
  | RewardSources
  | Rewards // Authenticated query
  | Balance; // Authenticated query

// ======== Query Response Interfaces ========

interface TokenInfoResponse {
  token_info: {
    name: string;
    symbol: string;
    decimals: number;
    total_supply?: string;
  };
}

interface AdminResponse {
  admin: {
    address: string;
  };
}

interface RewardsResponse {
  rewards: {
    rewards: string;
  };
}

interface BalanceResponse {
  balance: {
    amount: string;
  };
}

interface ContractStatusResponse {
  contract_status: {
    is_stopped: boolean;
  };
}

interface RewardTokenResponse {
  reward_token: {
    token: SecretContract;
  };
}

interface IncentivizedTokenResponse {
  incentivized_token: {
    token: SecretContract;
  };
}

interface TotalLockedResponse {
  total_locked: {
    amount: string;
  };
}

interface SubscribersResponse {
  subscribers: {
    contracts: SecretContract[];
  };
}

interface RewardSourcesResponse {
  reward_sources: {
    contracts: SecretContract[];
  };
}

interface QueryErrorResponse {
  query_error: {
    msg: string;
  };
}

export type LPStakingQueryAnswer =
  | TokenInfoResponse
  | AdminResponse
  | RewardsResponse
  | BalanceResponse
  | ContractStatusResponse
  | RewardTokenResponse
  | IncentivizedTokenResponse
  | TotalLockedResponse
  | SubscribersResponse
  | RewardSourcesResponse
  | QueryErrorResponse;

// ======== Type Guard Functions ========

// Type guards for execute responses

export function isRedeemResponse(response: LPStakingExecuteAnswer): response is RedeemResponse {
  return 'redeem' in response;
}

export function isCreateViewingKeyResponse(
  response: LPStakingExecuteAnswer
): response is CreateViewingKeyResponse {
  return 'create_viewing_key' in response;
}

export function isSetViewingKeyResponse(
  response: LPStakingExecuteAnswer
): response is SetViewingKeyResponse {
  return 'set_viewing_key' in response;
}

//  Type guards for query responses

export function isBalanceResponse(response: LPStakingQueryAnswer): response is BalanceResponse {
  return 'balance' in response;
}

export function isRewardsResponse(response: LPStakingQueryAnswer): response is RewardsResponse {
  return 'rewards' in response;
}

export function isQueryErrorResponse(
  response: LPStakingQueryAnswer
): response is QueryErrorResponse {
  return 'query_error' in response;
}
