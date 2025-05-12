import { Token } from '@/types';
import { create } from 'zustand';

interface TokenStoreState {
  tokens: Record<string, Token>;
  setToken: (address: string, token: Token) => void;
  initializeTokens: (tokens: Record<string, Token>) => void;
  listAllTokens: () => Token[];
  getTokenByAddress: (address: string) => Token | null;
  getTokenBySymbol: (symbol: string) => Token | null;
}

export const useTokenStore = create<TokenStoreState>((set, get) => ({
  tokens: {},

  setToken: (address, token) => {
    if (address !== token.address) {
      throw new Error(
        'Token address inconsistency between address used as key and address in token object'
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
    set(() => ({
      tokens,
    }));
  },

  listAllTokens: () => {
    const { tokens } = get();
    return Object.values(tokens);
  },

  getTokenByAddress: (address) => {
    const { tokens } = get();
    return tokens[address] ?? null;
  },

  getTokenBySymbol: (symbol) => {
    const { tokens } = get();
    return Object.values(tokens).find((token) => token.symbol === symbol) || null;
  },
}));
