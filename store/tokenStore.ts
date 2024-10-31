import { create } from "zustand";
import { Token } from "@/types";
import { getApiTokenSymbol } from "@/utils/apis/getSwappableTokens";

interface TokenStoreState {
  tokens: Record<string, Token> | null;
  setToken: (address: string, token: Token) => void;
  initializeTokens: (tokens: Record<string, Token>) => void;
  listAllTokens: () => Token[] | null;
  getTokenByAddress: (address: string) => Token | null;
  getTokenBySymbol: (symbol: string) => Token | null;
}

export const useTokenStore = create<TokenStoreState>((set, get) => ({
  tokens: null,

  setToken: (address, token) => {
    if (address !== token.address) {
      throw new Error(
        "Token address inconsistency between address used as key and address in token object"
      );
    }
    set((state) => ({
      tokens: {
        ...state.tokens,
        [address]: token,
      },
    }));
  },

  initializeTokens: (tokens) => {
    // let's see if we can find SSCRT in the tokens
    // const sscrtToken = tokens["secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek"];
    // if (!sscrtToken) {
    //   throw new Error("SSCRT token not found");
    // }
    set(() => ({
      tokens,
    }));
  },

  listAllTokens: () => {
    const { tokens } = get();
    return tokens ? Object.values(tokens) : null;
  },

  getTokenByAddress: (address) => {
    const { tokens } = get();
    return tokens !== null && tokens[address] ? tokens[address] : null;
  },

  getTokenBySymbol: (symbol) => {
    const { tokens } = get();
    return tokens
      ? Object.values(tokens).find(
          (token) => getApiTokenSymbol(token) === symbol
        ) || null
      : null;
  },
}));
