import { ConfigToken } from '@/config/tokens';
// import { ApiToken } from '@/utils/apis/getSwappableTokens';
import { SecretString } from '@/types';
import { StakingContractInfo } from '@/utils/staking/stakingRegistry';
import { useStaking } from '../useStaking';

export interface PairPoolData {
  assets: PoolAsset[];
  total_share: string;
}

interface PoolAsset {
  info: {
    token: {
      contract_addr: SecretString;
      token_code_hash: string;
      viewing_key: string;
    };
  };
  amount: string;
}

export interface PoolDetails {
  contract_address: SecretString;
  name: string;
}

export interface PoolQueryResult {
  pools: PoolDetails[];
  pairPoolData: PairPoolData;
  poolDetails: PoolDetails | undefined;
}

export interface LoadingState {
  status: 'loading' | 'error' | 'success';
  message: string | undefined;
}

export interface PairInfo {
  contract_addr: SecretString;
  asset_infos: Array<{
    token: {
      contract_addr: SecretString;
      token_code_hash: string;
      viewing_key: string;
    };
  }>;
  liquidity_token: string;
  token_code_hash: string;
}

export interface SelectedPoolType {
  address: SecretString;
  token0: ConfigToken;
  token1: ConfigToken;
  pairInfo: PairInfo;
}

export interface WithdrawEstimate {
  token0Amount: string;
  token1Amount: string;
  proportion: string; // Percentage of pool being withdrawn
  isValid: boolean;
  error?: string;
}

export interface ValidationWarning {
  field: 'tokenA' | 'tokenB' | 'lpToken';
  message: string;
  maxAvailable: string;
  tokenSymbol: string;
}

export interface UsePoolDepositFormResult {
  tokenInputs: Record<string, { amount: string; balance: string }>;
  setTokenInputAmount: (key: string, value: string) => void;
  setMax: (inputIdentifier: string) => void;
  selectedPool: SelectedPoolType | null;
  handleClick: (intent: 'deposit' | 'withdraw') => void;
  loadingState: LoadingState;
  poolDetails: PoolDetails | undefined;
  pairPoolData: PairPoolData | undefined;
  withdrawEstimate: WithdrawEstimate | null;
  validationWarning: ValidationWarning | null;

  // Staking properties
  hasStakingRewards: boolean;
  stakingInfo: StakingContractInfo | null;
  staking: ReturnType<typeof useStaking> | null;
  autoStake: boolean;
  setAutoStake: (autoStake: boolean) => void;
}
