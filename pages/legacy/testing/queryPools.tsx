import { ContractPool } from '@/types/ContractPool';
import isNotNullish from '@/utils/isNotNullish';
import { queryPools } from '@/utils/secretjs/pools/queryPools';
import { Window as KeplrWindow, Window } from '@keplr-wallet/types';
import { useEffect, useState } from 'react';
import { SecretNetworkClient } from 'secretjs';

const QueryPools = () => {
  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);
  const [address, setAddress] = useState<string | undefined>('');
  const [pools, setPools] = useState<ContractPool[]>([]);
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
      if (typeof offlineSigner === 'undefined') {
        setError('No offline signer found');
        return;
      }
      if (
        typeof accounts === 'undefined' ||
        accounts.length === 0 ||
        typeof accounts[0] === 'undefined'
      ) {
        setError('No accounts found');
        return;
      }

      const client = new SecretNetworkClient({
        chainId: 'secret-4',
        url: 'https://rpc.ankr.com/http/scrt_cosmos',
        wallet: offlineSigner,
        walletAddress: accounts[0].address,
      });

      setSecretjs(client);
      setAddress(accounts?.[0].address);
    };

    void connectKeplr();
  }, []);

  const handleQueryPools = async () => {
    if (!secretjs) return;

    const contractAddress = 'secret1fz6k6sxlnqwga9q67y9wly6q9hcknddn8alrtg'; // sCRT-sAAVE https://docs.secretswap.net/resources/contract-addresses
    const contractCodeHash = '0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490';

    try {
      const pools = await queryPools(secretjs, contractAddress, contractCodeHash);
      setPools(pools);
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
        {typeof address !== 'undefined' && address.length > 0 ? (
          <div>
            <p className="text-lg">Connected as: {address}</p>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
              onClick={() => void handleQueryPools()}
            >
              Query Pools
            </button>
            {pools.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold mt-4">Pools</h2>
                <ul className="mt-2">
                  {pools.map((pool, index) => (
                    <li key={index} className="text-lg">
                      {'native_token' in pool.info ? (
                        <span>
                          Native token {pool.info.native_token.denom}: {pool.amount}
                        </span>
                      ) : (
                        <span>
                          Token contract {pool.info.token.contract_addr}: {pool.amount}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              // some pre text with tailwind styling for mono font
              <pre className="text-lg bg-gray-800 p-4 mt-4">
                {JSON.stringify(pools.length, null, 2)}
              </pre>
            )}
            {error !== null && error !== undefined && error.length > 0 && (
              <p className="text-lg text-red-500 mt-4">{error}</p>
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
