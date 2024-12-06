import { SecretString } from '@/types';
import { ApiToken } from '@/utils/apis/getSwappableTokens';

export interface PairPoolData {
  assets: PoolAsset[];
  total_share: string;
}

export interface PoolAsset {
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
  about: string;
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
  token0: ApiToken;
  token1: ApiToken;
  pairInfo: PairInfo;
}

export interface WithdrawEstimate {
  token0Amount: string;
  token1Amount: string;
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
}
