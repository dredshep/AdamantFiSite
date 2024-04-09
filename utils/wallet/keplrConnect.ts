import { useStore } from "@/store/swapStore";
import { useWalletStore } from "@/store/walletStore";

type CustomWindow = typeof window & {
  keplr: any;
};

const keplrConnect = async () => {
  const { keplr }: CustomWindow = window as CustomWindow;
  if (keplr) {
    try {
      const chainId = "secret-4";
      await keplr.enable(chainId);
      const offlineSigner = keplr.getOfflineSigner(chainId);
      const accounts = await offlineSigner.getAccounts();

      if (accounts && accounts.length > 0) {
        const { address } = accounts[0];
        useWalletStore.getState().connectWallet(address);
        console.log("Connected to Keplr.");
      }
    } catch (error) {
      console.error("Error connecting to Keplr:", error);
      useStore.getState().setConnectionRefused(true);
    }
  } else {
    console.log("Keplr extension not found.");
  }
};

export default keplrConnect;
