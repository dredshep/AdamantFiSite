import React from "react";
import { useViewingKeyStore } from "@/store/viewingKeyStore";
import { SecretString } from "@/types";

const SyncViewingKeyButton = ({
  tokenAddress,
}: {
  tokenAddress: SecretString;
}) => {
  const setViewingKey = useViewingKeyStore((state) => state.setViewingKey);

  const handleSyncViewingKey = async () => {
    try {
      if (!window.keplr) {
        alert("Keplr extension not detected.");
        return;
      }

      if (!process.env.NEXT_PUBLIC_CHAIN_ID) {
        alert("Chain ID not set in environment.");
        return;
      }
      // Request the user's permission to fetch the viewing key
      const chainId = process.env.NEXT_PUBLIC_CHAIN_ID!; // Ensure this is set in your environment
      const viewingKey = await (window.keplr as any).getSecret20ViewingKey(
        chainId,
        tokenAddress
      );

      // Store the viewing key in the Zustand store
      setViewingKey(tokenAddress, viewingKey);
      alert("Viewing key synchronized successfully.");
    } catch (error) {
      console.error("Error fetching viewing key:", error);
      alert(
        "Failed to sync the viewing key. Make sure the token is registered in Keplr."
      );
    }
  };

  return (
    <button
      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      onClick={handleSyncViewingKey}
    >
      Sync Key
    </button>
  );
};

export default SyncViewingKeyButton;
