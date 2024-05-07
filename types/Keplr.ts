// types/keplr.ts
import { OfflineSigner } from "@cosmjs/proto-signing";

interface Keplr {
  enable(chainId: string): Promise<void>;
  getSecret20ViewingKey(chainId: string, contractAddr: string): Promise<string>;
  suggestToken(chainId: string, contractAddr: string): Promise<void>;
  getOfflineSigner(chainId: string): OfflineSigner;
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
    keplr?: Keplr;
  }
}
