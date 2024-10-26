import React from "react";
import { useViewingKeyStore } from "@/store/viewingKeyStore2";
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

      if (
        typeof process.env["NEXT_PUBLIC_CHAIN_ID"] === "undefined" ||
        process.env["NEXT_PUBLIC_CHAIN_ID"].length === 0
      ) {
        alert("Chain ID not set in environment.");
        return;
      }
      // Request the user's permission to fetch the viewing key
      const chainId = process.env["NEXT_PUBLIC_CHAIN_ID"];
      const viewingKey = await (
        window.keplr as unknown as {
          getSecret20ViewingKey: (
            chainId: string,
            contractAddress: string
          ) => Promise<string>;
        }
      ).getSecret20ViewingKey(chainId, tokenAddress);

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
      onClick={() => void handleSyncViewingKey()}
    >
      Sync Key
    </button>
  );
};

export default SyncViewingKeyButton;
