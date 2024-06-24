import { useState, useEffect } from "react";
import { SecretNetworkClient } from "secretjs";
import { Window as KeplrWindow } from "@keplr-wallet/types";
import { queryPools } from "@/utils/secretjs/queryPools";
import { ContractPool } from "@/types/ContractPool";

const QueryPools = () => {
  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);
  const [address, setAddress] = useState<string | undefined>("");
  const [pools, setPools] = useState<ContractPool[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const connectKeplr = async () => {
      if (!window.keplr) {
        alert("Please install Keplr extension");
        return;
      }

      await window.keplr.enable("secret-4");

      const offlineSigner = (
        window as unknown as KeplrWindow
      ).getOfflineSigner?.("secret-4");
      const accounts = await offlineSigner?.getAccounts();

      const client = new SecretNetworkClient({
        chainId: "secret-4",
        url: "https://scrt.public-rpc.com",
        wallet: offlineSigner,
        walletAddress: accounts?.[0].address,
      });

      setSecretjs(client);
      setAddress(accounts?.[0].address);
    };

    connectKeplr();
  }, []);

  const handleQueryPools = async () => {
    if (!secretjs) return;

    const contractAddress = "secret1fz6k6sxlnqwga9q67y9wly6q9hcknddn8alrtg"; // sCRT-sAAVE https://docs.secretswap.net/resources/contract-addresses

    try {
      const pools = await queryPools(secretjs, contractAddress);
      setPools(pools);
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="p-20">
        <h1 className="text-4xl font-bold">Query Pools</h1>
        {address ? (
          <div>
            <p className="text-lg">Connected as: {address}</p>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
              onClick={handleQueryPools}
            >
              Query Pools
            </button>
            {pools.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mt-4">Pools</h2>
                <ul className="mt-2">
                  {pools.map((pool, index) => (
                    <li key={index} className="text-lg">
                      {"native_token" in pool.info ? (
                        <span>
                          Native token {pool.info.native_token.denom}:{" "}
                          {pool.amount}
                        </span>
                      ) : (
                        <span>
                          Token contract {pool.info.token.contract_addr}:{" "}
                          {pool.amount}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-lg">Connecting to Keplr...</p>
        )}
      </div>
    </div>
  );
};

export default QueryPools;
