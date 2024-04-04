import { SecretString } from "../SecretString";

export interface WalletState {
  address: SecretString | null;
  SCRTBalance: string;
  ADMTBalance: string;
}
