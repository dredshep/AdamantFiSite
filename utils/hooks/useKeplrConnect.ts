// hooks/useKeplrConnection.ts
import { useEffect } from "react";
import { useSwapStore } from "@/store/swapStore";
import { Window as KeplrWindow } from "@keplr-wallet/types";
import { SecretString } from "@/types";

const useKeplrConnect = (manual: boolean) => {
  useEffect(() => {
    // check if user already rejected connection
    // let attemptedConnection: boolean | undefined;

    const attemptConnection = async () => {
      const { keplr }: KeplrWindow = window as unknown as KeplrWindow;
      const connectionRefused = useSwapStore.getState().connectionRefused;

      // if not manually connecting and user already rejected connection, do not attempt connection
      if (keplr && !manual && connectionRefused) {
        // attemptedConnection = true;
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
            // Update the store with the user's address
            useSwapStore.getState().connectWallet(address as SecretString);

            // Here, you might also want to fetch and update the SCRT and ADMT balances
            // For example:
            // useStore.getState().updateBalance('SCRT', '100'); // Fetch and use actual balance
            // useStore.getState().updateBalance('ADMT', '200'); // Fetch and use actual balance
          }
        } catch (error) {
          console.error("Error connecting to Keplr:", error);
          // set connection refused to true so we only connect again if the user clicks the connect button
          useSwapStore.getState().setConnectionRefused(true);
        }
      }
    };

    if (manual) {
      void attemptConnection();
    }

    // Optional: Listen for account change
    window.addEventListener(
      "keplr_keystorechange",
      () => void attemptConnection()
    );

    return () => {
      window.removeEventListener(
        "keplr_keystorechange",
        () => void attemptConnection()
      );
    };
  }, [manual]); // Ensure this runs whenever the manual param changes
};

export default useKeplrConnect;
