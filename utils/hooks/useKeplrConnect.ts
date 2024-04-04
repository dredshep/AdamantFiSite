// hooks/useKeplrConnection.ts
import { useEffect } from "react";
import { useStore } from "@/store/swapStore";

type CustomWindow = typeof window & {
  keplr: any;
};

const useKeplrConnect = (manual: boolean) => {
  useEffect(() => {
    // check if user already rejected connection
    let attemptedConnection = false;

    const attemptConnection = async () => {
      const { keplr }: CustomWindow = window as CustomWindow;
      const connectionRefused = useStore.getState().connectionRefused;

      // if not manually connecting and user already rejected connection, do not attempt connection
      if (keplr && !manual && connectionRefused) {
        attemptedConnection = true;
        try {
          const chainId = "secret-4";
          await keplr.enable(chainId);
          const offlineSigner = keplr.getOfflineSigner(chainId);
          const accounts = await offlineSigner.getAccounts();

          if (accounts && accounts.length > 0) {
            const { address } = accounts[0];
            // Update the store with the user's address
            useStore.getState().connectWallet(address);

            // Here, you might also want to fetch and update the SCRT and ADMT balances
            // For example:
            // useStore.getState().updateBalance('SCRT', '100'); // Fetch and use actual balance
            // useStore.getState().updateBalance('ADMT', '200'); // Fetch and use actual balance
          }
        } catch (error) {
          console.error("Error connecting to Keplr:", error);
          // set connection refused to true so we only connect again if the user clicks the connect button
          useStore.getState().setConnectionRefused(true);
        }
      }
    };

    if (manual) {
      attemptConnection();
    }

    // Optional: Listen for account change
    window.addEventListener("keplr_keystorechange", attemptConnection);

    return () => {
      window.removeEventListener("keplr_keystorechange", attemptConnection);
    };
  }, [manual]); // Ensure this runs whenever the manual param changes
};

export default useKeplrConnect;
