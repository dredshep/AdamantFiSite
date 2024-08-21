// Define the interfaces for the various Keplr functionalities.

import { Signer } from "secretjs/dist/wallet_amino";

interface ExperimentalKeplrType {
  enable(chainId: string): Promise<void>;
  getOfflineSignerOnlyAmino(chainId: string): Signer;
  getOfflineSigner(chainId: string): Signer;
  getOfflineSignerAuto(chainId: string): Signer;
  getEnigmaUtils(chainId: string): EnigmaUtils;
  suggestChain(chainInfo: ChainInfo): Promise<void>;
  experimentalSuggestChain(chainInfo: ChainInfo): Promise<void>;
  getKey(chainId: string): Promise<Key>;
  getRegisteredSecret20Tokens(chainId: string): Promise<string[]>;
}

// interface OfflineSigner {
//   getAccounts(): Promise<AccountData[]>;
// }

// interface OfflineSignerAmino extends OfflineSigner {
//   // Inherits getAccounts from OfflineSigner
// }

interface AccountData {
  address: string;
  algo: string;
  pubkey: Uint8Array;
}

interface EnigmaUtils {
  getPubkey(): Uint8Array;
  getTxEncryptionKey(nonce: Uint8Array): Promise<Uint8Array>;
  encrypt(msg: Uint8Array): Uint8Array;
  decrypt(cipherText: Uint8Array): Uint8Array;
}

interface ChainInfo {
  chainId: string;
  chainName: string;
  rpc: string;
  rest: string;
  bip44: {
    coinType: number;
  };
  bech32Config: {
    bech32PrefixAccAddr: string;
    bech32PrefixAccPub: string;
    bech32PrefixValAddr: string;
    bech32PrefixValPub: string;
    bech32PrefixConsAddr: string;
    bech32PrefixConsPub: string;
  };
  currencies: {
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
  }[];
  feeCurrencies: {
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
  }[];
  stakeCurrency: {
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
  };
  coinType: number;
  gasPriceStep: {
    low: number;
    average: number;
    high: number;
  };
}

interface Key {
  name: string;
  algo: string;
  pubKey: string;
  address: string;
  isNanoLedger: boolean;
}

export type { ExperimentalKeplrType, AccountData, EnigmaUtils, ChainInfo, Key };

declare global {
  interface Window {
    keplr?: ExperimentalKeplrType;
    // getOfflineSigner(chainId: string): OfflineSigner;
    // getEnigmaUtils(): EnigmaUtils;
  }
}
