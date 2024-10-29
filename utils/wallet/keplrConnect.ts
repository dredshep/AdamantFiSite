import { useSwapStore } from "@/store/swapStore";
import { useWalletStore } from "@/store/walletStore";
import { SecretString } from "@/types";
import { Window } from "@keplr-wallet/types";

const keplrConnect = async () => {
  const { keplr } = window as unknown as Window;
  if (keplr) {
    try {
      const chainId = "secret-4";
      await keplr.enable(chainId);
      const offlineSigner = keplr.getOfflineSigner(chainId);
      const accounts = await offlineSigner.getAccounts();

      if (
        accounts !== undefined &&
        accounts.length > 0 &&
        accounts[0] !== undefined
      ) {
        const { address } = accounts[0];
        useWalletStore.getState().connectWallet(address as SecretString);
        console.log("Connected to Keplr.");
      }
    } catch (error) {
      console.error("Error connecting to Keplr:", error);
      useSwapStore.getState().setConnectionRefused(true);
    }
  } else {
    console.log("Keplr extension not found.");
  }
};

export default keplrConnect;
