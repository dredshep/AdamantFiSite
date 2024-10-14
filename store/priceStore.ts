import { create } from "zustand";

interface PriceState {
  prices: Record<string, { price: number; lastUpdated: number }>;
  setPrice: (tokenAddress: string, price: number) => void;
  getPrice: (tokenAddress: string) => number | null;
}

const PRICE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

export const usePriceStore = create<PriceState>((set, get) => ({
  prices: {},
  setPrice: (tokenAddress, price) => {
    set((state) => ({
      prices: {
        ...state.prices,
        [tokenAddress]: { price, lastUpdated: Date.now() },
      },
    }));
  },
  getPrice: (tokenAddress) => {
    const priceData = get().prices[tokenAddress];
    if (!priceData) return null;
    if (Date.now() - priceData.lastUpdated > PRICE_EXPIRY_TIME) return null;
    return priceData.price;
  },
}));
