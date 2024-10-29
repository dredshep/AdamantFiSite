import { useSwapStore } from "@/store/swapStore";

const keplrDisconnect = () => {
  useSwapStore.getState().disconnectWallet();

  useSwapStore.getState().updateBalance("SCRT", "0");
  useSwapStore.getState().updateBalance("ADMT", "0");
  useSwapStore.getState().setConnectionRefused(true);

  console.log("Disconnected from Keplr.");
};

export default keplrDisconnect;
