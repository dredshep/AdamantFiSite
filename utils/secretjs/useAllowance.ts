import { useState, useEffect } from "react";
import { SecretNetworkClient } from "secretjs";

export default function useAllowance() {
  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const main = async () => {
      if (!window.keplr) {
        setError("Keplr extension not detected.");
        return;
      }
      const chainId = "secret-4"; // Use the correct chain ID for your network
      await window.keplr.enable(chainId);
      const offlineSigner = window.keplr.getOfflineSignerOnlyAmino(chainId);
      const secretjsClient = new SecretNetworkClient({
        // mainnet secret network rpc url
        url: "https://scrt.public-rpc.com",
        chainId,
        wallet: offlineSigner,
        walletAddress: (await offlineSigner.getAccounts())[0].address,
      });
      setSecretjs(secretjsClient);
    };
    main();
  }, []);

  return { secretjs, error };
}
