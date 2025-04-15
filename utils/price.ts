import { create } from 'zustand';

const COINGECKO_IDS = {
  secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek: 'secret', // SCRT
  secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt: 'secret-finance', // SEFI
  secret1qfql357amn448duf5gvp9gr48sxx9tsnhupu3d: 'ethereum', // ETH
  secret1vq0gc5wdjqnalvtgra3dr4m07kaxkhq2zjq589: 'cosmos', // ATOM
  secret1h6z05y90gwm4sqxzhz4pkyj36cpkp8fgcpwgva: 'usd-coin', // USDC
};

interface PriceState {
  prices: Record<string, number>;
}

export const usePriceStore = create<PriceState>(() => ({
  prices: {},
}));

// Add type for CoinGecko response
type CoinGeckoResponse = Record<string, { usd: number }>;

// Global price updater
class GlobalPriceUpdater {
  private static instance: GlobalPriceUpdater;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.startUpdating();
  }

  static getInstance() {
    if (GlobalPriceUpdater.instance === undefined) {
      GlobalPriceUpdater.instance = new GlobalPriceUpdater();
    }
    return GlobalPriceUpdater.instance;
  }

  private async fetchPrices() {
    try {
      const ids = Object.values(COINGECKO_IDS).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
      );
      const data = (await response.json()) as CoinGeckoResponse;

      const prices = Object.entries(COINGECKO_IDS).reduce((acc, [address, geckoId]) => {
        acc[address] = data[geckoId]?.usd ?? 0;
        return acc;
      }, {} as Record<string, number>);

      usePriceStore.setState({ prices });
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }
  }

  private startUpdating() {
    // Initial fetch
    void this.fetchPrices();

    // Update every 5 minutes
    this.intervalId = setInterval(() => void this.fetchPrices(), 5 * 60 * 1000);
  }

  public stopUpdating() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Initialize the global updater in your app
export const initializePrices = () => GlobalPriceUpdater.getInstance();

// Helper to get USD value
export const getUsdValue = (tokenAddress: string, amount: string): number => {
  const price = usePriceStore.getState().prices[tokenAddress] ?? 0;
  return price * parseFloat(amount || '0');
};
