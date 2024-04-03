import { Token } from "@/types/Token";
import { SharedSettings } from "@/types/store/SharedSettings";
import { TokenInputState } from "@/types/store/TokenInputState";
import { TokenInputs } from "@/types/store/TokenInputs";

export interface StoreState {
  tokenInputs: TokenInputs;
  sharedSettings: SharedSettings;
  setTokenInputProperty: <T extends keyof TokenInputState>(
    inputIdentifier: keyof TokenInputs,
    property: T,
    value: TokenInputState[T]
  ) => void;
  setSharedSetting: <T extends keyof SharedSettings>(
    setting: T,
    value: SharedSettings[T]
  ) => void;
  swappableTokens: Token[];
  setSwappableTokens: (tokens: Token[]) => void;
}
