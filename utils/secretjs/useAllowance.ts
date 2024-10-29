import { useState, useEffect } from "react";
import { CreateClientOptions, SecretNetworkClient } from "secretjs";

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
      const accounts = await offlineSigner.getAccounts();
      const opts = {
        // mainnet secret network rpc url
        url: "https://scrt.public-rpc.com",
        chainId,
        wallet: offlineSigner,
      } as CreateClientOptions;
      if (accounts[0] !== undefined) {
        opts.walletAddress = accounts[0].address;
      }
      const secretjsClient = new SecretNetworkClient(opts);
      setSecretjs(secretjsClient);
    };
    void main();
  }, []);

  return { secretjs, error };
}
