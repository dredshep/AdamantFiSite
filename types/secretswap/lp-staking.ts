// Types for LP Staking Contract interactions

/**
 * Secret contract interface
 * @remarks This old type uses contract_hash instead of code_hash
 */
interface SecretContract {
  address: string;
  contract_hash: string;
}

/**
 * Execute messages for LP Staking contract
 */
export type LPStakingExecuteMsg =
  | {
      /**
       * Redeem action allows users to claim accumulated rewards
       * and optionally withdraw staked LP tokens
       */
      redeem: {
        /**
         * Optional amount of LP tokens to withdraw (unstake)
         * If not provided, only pending rewards will be claimed
         * without affecting the staked position
         */
        amount?: string;
      };
    }
  | {
      create_viewing_key: {
        entropy: string;
        padding?: string;
      };
    }
  | {
      set_viewing_key: {
        key: string;
        padding?: string;
      };
    };

/**
 * Receive messages for LP Staking contract
 * @note Send via SNIP20 'Send' message with attached 'msg'
 */
export type LPStakingRecieveMsg = { deposit: Record<string, never> };

/**
 * Response types for LP Staking contract execute messages
 */
export type LPStakingExecuteAnswer =
  | {
      redeem: {
        status: LPStakingResponseStatus;
      };
    }
  | {
      create_viewing_key: {
        key: string;
      };
    }
  | {
      set_viewing_key: {
        status: LPStakingResponseStatus;
      };
    };

/**
 * Query messages for LP Staking contract
 */
export type LPStakingQueryMsg =
  | { token_info: Record<string, never> }
  | { admin: Record<string, never> }
  | { contract_status: Record<string, never> }
  | { reward_token: Record<string, never> }
  | { incentivized_token: Record<string, never> }
  | { total_locked: Record<string, never> }
  | { subscribers: Record<string, never> }
  | { reward_sources: Record<string, never> }
  // Authenticated queries - require viewing key
  | {
      rewards: {
        address: string;
        key: string;
        height: number;
      };
    }
  | {
      balance: {
        address: string;
        key: string;
      };
    };

/**
 * Response types for LP Staking contract query messages
 */
export type LPStakingQueryAnswer =
  | {
      token_info: {
        name: string;
        symbol: string;
        decimals: number;
        total_supply?: string;
      };
    }
  | {
      admin: {
        address: string;
      };
    }
  | {
      rewards: {
        rewards: string;
      };
    }
  | {
      balance: {
        amount: string;
      };
    }
  | {
      contract_status: {
        is_stopped: boolean;
      };
    }
  | {
      reward_token: {
        token: SecretContract;
      };
    }
  | {
      incentivized_token: {
        token: SecretContract;
      };
    }
  | {
      total_locked: {
        amount: string;
      };
    }
  | {
      subscribers: {
        contracts: SecretContract[];
      };
    }
  | {
      reward_sources: {
        contracts: SecretContract[];
      };
    }
  | {
      query_error: {
        msg: string;
      };
    };

/**
 * Response status for LP Staking operations
 */
export enum LPStakingResponseStatus {
  Success = 'success',
  Failure = 'failure',
}
