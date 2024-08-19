import { useState, useEffect } from "react";
import { SecretNetworkClient } from "secretjs";
import { Window as KeplrWindow } from "@keplr-wallet/types";
import { processPoolsData } from "../../../../utils/secretjs/decimals/utils/processPoolData";
import { fullPoolsData } from "../../../../components/app/Testing/fullPoolsData";

const QueryTokenDecimals = () => {
  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);
  const [address, setAddress] = useState<string | undefined>("");
  const [tokenDetails, setTokenDetails] = useState<
    {
      contract_addr: string;
      decimals: number;
    }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const connectKeplr = async () => {
      if (!window.keplr) {
        alert("Please install Keplr extension");
        return;
      }

      try {
        await window.keplr.enable("secret-4");

        const offlineSigner = (
          window as unknown as KeplrWindow
        ).getOfflineSigner?.("secret-4");
        const accounts = await offlineSigner?.getAccounts();

        const client = new SecretNetworkClient({
          chainId: "secret-4",
          url: "https://rpc.ankr.com/http/scrt_cosmos",
          wallet: offlineSigner,
          walletAddress: accounts?.[0].address,
        });

        setSecretjs(client);
        setAddress(accounts?.[0].address);
      } catch (error) {
        setError("Failed to connect to Keplr: " + (error as Error).message);
      }
    };

    connectKeplr();
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="p-20">
        <h1 className="text-4xl font-bold">Query Token Decimals</h1>
        {address ? (
          <div>
            <p className="text-lg">Connected as: {address}</p>
            {secretjs && (
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
                onClick={() =>
                  processPoolsData(
                    secretjs,
                    fullPoolsData,
                    setError,
                    setTokenDetails
                  )
                }
              >
                Query Token Decimals
              </button>
            )}
            {tokenDetails.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold mt-4">Token Details</h2>
                <pre className="text-lg bg-gray-800 p-4 mt-4">
                  {JSON.stringify(tokenDetails, null, 2)}
                </pre>
              </div>
            ) : (
              <pre className="text-lg bg-gray-800 p-4 mt-4">
                {JSON.stringify(tokenDetails.length, null, 2)}
              </pre>
            )}
            {error && <p className="text-lg text-red-500 mt-4">{error}</p>}
          </div>
        ) : (
          <p className="text-lg">Connecting to Keplr...</p>
        )}
      </div>
    </div>
  );
};

export default QueryTokenDecimals;
