import { ApiToken } from "@/utils/apis/getSwappableTokens";
import { SecretString } from "./SecretString";

export interface NativeToken {
  symbol: string;
  address: SecretString;
  isNativeToken: true;
  balance?: string;
  network?: string;
  decimals?: number;
  iconUrl?: string;
  name?: string;
  description?: string;
  usdPrice?: string;
  priceVsNativeToken: string;
}

export interface SwappableToken {
  symbol: string;
  address: SecretString;
  isNativeToken: boolean;
  balance?: string;
  viewingKey: string;
  protocol: string;
  network?: string;
  decimals?: number;
  iconUrl?: string;
  name?: string;
  description?: string;
  usdPrice?: string;
  priceVsNativeToken: string;
}

// export type Token = NativeToken | SwappableToken;
export type Token = ApiToken;
