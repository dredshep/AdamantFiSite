// types/keplr.ts
import { OfflineSigner } from "@cosmjs/proto-signing";
import { SecretUtils } from "@keplr-wallet/types";
import { EnigmaUtils } from "./enigma-utils";
import { ExperimentalKeplrType } from "./ExperimentalKeplrType";

interface Keplr {
  enable(chainId: string): Promise<void>;
  getSecret20ViewingKey(chainId: string, contractAddr: string): Promise<string>;
  suggestToken(chainId: string, contractAddr: string): Promise<void>;
  //   getOfflineSigner(chainId: string): OfflineSigner;
  experimentalSuggestChain(chainInfo: ChainInfo): Promise<void>;
  // Add other methods as needed
}

interface ChainInfo {
  chainId: string;
  chainName: string;
  rpc: string;
  rest: string;
  // Additional properties can be added as needed
}

declare global {
  interface Window {
    keplr?: ExperimentalKeplrType;
    // getOfflineSigner(chainId: string): OfflineSigner;
    // getEnigmaUtils(): EnigmaUtils;
  }
}
