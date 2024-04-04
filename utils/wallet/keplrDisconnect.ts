import { useStore } from "@/store/swapStore";

const keplrDisconnect = () => {
  useStore.getState().disconnectWallet();

  useStore.getState().updateBalance("SCRT", "0");
  useStore.getState().updateBalance("ADMT", "0");
  useStore.getState().setConnectionRefused(true);

  console.log("Disconnected from Keplr.");
};

export default keplrDisconnect;
