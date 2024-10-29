import { SwappableToken } from "@/types";

export interface PairPoolData {
  assets: PoolAsset[];
  total_share: string;
}

export interface PoolAsset {
  info: {
    token: {
      contract_addr: string;
      token_code_hash: string;
      viewing_key: string;
    };
  };
  amount: string;
}

export interface PoolDetails {
  contract_address: string;
  name: string;
  about: string;
}

export interface PoolQueryResult {
  pools: PoolDetails[];
  pairPoolData: PairPoolData;
  poolDetails: PoolDetails | undefined;
}

export interface LoadingState {
  status: "loading" | "error" | "success";
  message: string | undefined;
}

export interface PairInfo {
  contract_addr: string;
  asset_infos: Array<{
    token: {
      contract_addr: string;
      token_code_hash: string;
      viewing_key: string;
    };
  }>;
}

export interface SelectedPoolType {
  address: string;
  token0: SwappableToken;
  token1: SwappableToken;
  pairInfo: PairInfo;
}

export interface UsePoolDepositFormResult {
  tokenInputs: Record<string, { amount: string; balance: string }>;
  setTokenInputAmount: (key: string, value: string) => void;
  setMax: (inputIdentifier: string) => void;
  selectedPool: SelectedPoolType | null;
  // handleDepositClick: () => void;
  handleClick: (intent: "deposit" | "withdraw") => void;
  loadingState: LoadingState;
  poolDetails: PoolDetails | undefined;
  pairPoolData: PairPoolData | undefined;
}
