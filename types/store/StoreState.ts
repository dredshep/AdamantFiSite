import { Token } from "@/types/Token";
import { WalletState } from "@/types/store/WalletState";
import { SharedSettings } from "@/types/store/SharedSettings";
import { TokenInputs } from "@/types/store/TokenInputs";
import { TokenInputState } from "@/types/store/TokenInputState";
import { SecretString } from "../SecretString";

export interface StoreState {
  tokenInputs: TokenInputs;
  sharedSettings: SharedSettings;
  wallet: WalletState;
  chainId: string;
  swappableTokens: Token[] | null;
  connectionRefused: boolean;
  setTokenInputProperty: <T extends keyof TokenInputState>(
    inputIdentifier: keyof TokenInputs,
    property: T,
    value: TokenInputState[T]
  ) => void;
  setSharedSetting: <T extends keyof SharedSettings>(
    setting: T,
    value: SharedSettings[T]
  ) => void;
  connectWallet: (address: SecretString) => void;
  disconnectWallet: () => void;
  updateBalance: (tokenSymbol: "SCRT" | "ADMT", balance: string) => void;
  setChainId: (chainId: string) => void;
  setSwappableTokens: (tokens: Token[]) => void;
  setConnectionRefused: (refused: boolean) => void;
}
