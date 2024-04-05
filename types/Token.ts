import { SecretString } from "./SecretString";

export interface Token {
  symbol: string;
  address: SecretString;
  isNativeToken: boolean;
  balance?: string;
  viewingKey?: string;
  protocol?: string;

  network?: string;
  decimals?: number;
  iconUrl?: string;
  name?: string;
  description?: string;
  usdPrice?: string;
  scrtPrice?: string;
}
