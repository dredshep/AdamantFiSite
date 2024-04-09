import { SecretString } from "../SecretString";

export interface TokenInputState {
  tokenAddress: SecretString;
  amount: string;
}
