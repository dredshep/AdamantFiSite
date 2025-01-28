import isNotNullish from '@/utils/isNotNullish';
import { Window as KeplrWindow, Window } from '@keplr-wallet/types';
import { useEffect, useState } from 'react';
import { SecretNetworkClient } from 'secretjs';
import { queryPoolDetails as addresses } from '../../components/app/Testing/queryPoolDetails';

// const addresses = [
//   {
//     pair: "sSCRT-sAAVE",
//     contract_address: "secret1fz6k6sxlnqwga9q67y9wly6q9hcknddn8alrtg",
//     lp_token_contract: "secret1k6kpx2hv28yd73c9ethamvu48ke9vetqzju26",
//   },
//   // Add other pairs here...
// ];

const queryPools = async (secretjs: SecretNetworkClient, contractAddress: string) => {
  const queryMsg = { pool: {} };

  try {
    const queryResult = await secretjs.query.compute.queryContract({
      contract_address: contractAddress,
      query: queryMsg,
    });
    return queryResult;
  } catch (error) {
    console.error(`Error querying pools for ${contractAddress}:`, error);
    return null;
  }
};

const getCodeHash = async (secretjs: SecretNetworkClient, contractAddress: string) => {
  try {
    const codeHashResponse = await secretjs.query.compute.codeHashByContractAddress({
      contract_address: contractAddress,
    });
    return codeHashResponse.code_hash;
  } catch (error) {
    console.error(`Error fetching code hash for ${contractAddress}:`, error);
    return null;
  }
};

export interface PoolDetails {
  query_result: QueryResult;
  code_hash: string;
}

export interface QueryResult {
  assets: Asset[];
  total_share: string;
}

export interface Asset {
  info: Info;
  amount: string;
}

export interface Info {
  token: Token;
}

export interface Token {
  contract_addr: string;
  token_code_hash: string;
  viewing_key: string;
}

export interface PoolsData {
  pair: string;
  contract_address: string;
  lp_token_contract: string;
  query_result: QueryResult;
  code_hash: string;
}

const QueryPools = () => {
  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);
  const [address, setAddress] = useState<string | undefined>('');
  const [poolsData, setPoolsData] = useState<PoolsData[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const connectKeplr = async () => {
      if (!isNotNullish((window as unknown as Window).keplr)) {
        alert('Please install Keplr extension');
        return;
      }

      await (window as unknown as Window).keplr?.enable('secret-4');

      const offlineSigner = (window as unknown as KeplrWindow).getOfflineSigner?.('secret-4');
      const accounts = await offlineSigner?.getAccounts();

      if (
        !offlineSigner ||
        !accounts ||
        accounts.length === 0 ||
        typeof accounts[0]?.address !== 'string'
      ) {
        alert('No offline signer or accounts found');
        return;
      }
      const client = new SecretNetworkClient({
        chainId: 'secret-4',
        url: 'https://rpc.ankr.com/http/scrt_cosmos',
        wallet: offlineSigner,
        walletAddress: accounts?.[0].address,
      });

      setSecretjs(client);
      setAddress(accounts[0].address);
    };

    void connectKeplr();
  }, []);

  const handleQueryPools = async () => {
    if (!secretjs) return;

    try {
      const data: PoolsData[] = await Promise.all(
        addresses.map(async ({ pair, contract_address, lp_token_contract }) => {
          const queryResult = await queryPools(secretjs, contract_address);
          const codeHash = await getCodeHash(secretjs, contract_address);

          return {
            pair,
            contract_address,
            lp_token_contract,
            query_result: queryResult,
            code_hash: codeHash,
          } as PoolsData;
        })
      );

      setPoolsData(data);
    } catch (error) {
      const err = error as Error;
      const toString = (err: Error) => {
        return `${err.name}: ${err.message}`;
      };
      setError(toString(err));
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="p-20">
        <h1 className="text-4xl font-bold">Query Pools</h1>
        {typeof address === 'string' ? (
          <div>
            <p className="text-lg">Connected as: {address}</p>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
              onClick={() => void handleQueryPools()}
            >
              Query Pools
            </button>
            {typeof poolsData !== 'undefined' && poolsData?.length && poolsData.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold mt-4">Pools Data</h2>
                <pre className="text-lg bg-gray-800 p-4 mt-4">
                  {JSON.stringify(poolsData, null, 2)}
                </pre>
              </div>
            ) : (
              <pre className="text-lg bg-gray-800 p-4 mt-4">No data</pre>
            )}
            {typeof error === 'string' && <p className="text-lg text-red-500 mt-4">{error}</p>}
          </div>
        ) : (
          <p className="text-lg">Connecting to Keplr...</p>
        )}
      </div>
    </div>
  );
};

export default QueryPools;
