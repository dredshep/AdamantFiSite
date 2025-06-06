// import { Token } from "@/types/Token";
// import { WalletState } from "@/types/store/WalletState";
import { ConfigToken } from '@/config/tokens';
import { SharedSettings } from '@/types/store/SharedSettings';
import { SwapTokenInputs } from '@/types/store/TokenInputs';
import { TokenInputState } from '@/types/store/TokenInputState';
import { SecretString } from '../SecretString';

export interface SwapStoreState {
  [key: string]: unknown;

  swapTokenInputs: SwapTokenInputs;
  sharedSettings: SharedSettings;
  wallet: {
    address: SecretString | null;
    SCRTBalance: string;
    ADMTBalance: string;
    // other properties
  };
  chainId: string;
  swappableTokens: ConfigToken[] | null;
  connectionRefused: boolean;
  setTokenInputProperty: <T extends keyof TokenInputState>(
    inputIdentifier: keyof SwapTokenInputs,
    property: T,
    value: TokenInputState[T]
  ) => void;
  setSharedSetting: <T extends keyof SharedSettings>(setting: T, value: SharedSettings[T]) => void;
  connectWallet: (address: SecretString) => void;
  disconnectWallet: () => void;
  updateBalance: (tokenSymbol: 'SCRT' | 'ADMT', balance: string) => void;
  setChainId: (chainId: string) => void;
  setSwappableTokens: (tokens: ConfigToken[]) => void;
  setConnectionRefused: (refused: boolean) => void;
  setSlippage: (slippage: number) => void;
  getAvailableTokensForInput: (inputIdentifier: keyof SwapTokenInputs) => ConfigToken[];
  clearTokenSelection: (inputIdentifier: keyof SwapTokenInputs) => void;
  resetTokenSelections: () => void;
}
