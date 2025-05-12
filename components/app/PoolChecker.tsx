/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { fetchPoolData, validatePoolAddress } from '@/hooks/usePoolForm/queryFunctions';
import { usePoolsAndTokens } from '@/hooks/usePoolsAndTokens';
import { SecretString } from '@/types';
import { useEffect, useState } from 'react';

interface PoolCheckerProps {
  poolAddressToCheck?: string;
}

export function PoolChecker({
  poolAddressToCheck = 'secret1gdxk2ddtyrfzc3r9y8mw6ze4vh547gj8w3yjjy',
}: PoolCheckerProps) {
  const { walletAddress, chainId, connect } = useKeplrConnection();
  const { pools } = usePoolsAndTokens();
  const [result, setResult] = useState<{
    exists: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: any;
    error?: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [connected, setConnected] = useState(false);

  // Auto-connect to the wallet when component mounts
  useEffect(() => {
    if (!walletAddress && !connected) {
      void connect();
      setConnected(true);
    }
  }, [walletAddress, connect, connected]);

  // Function to check if pool exists
  const checkPool = async () => {
    setChecking(true);
    setResult(null);

    try {
      // Validate first
      if (
        !poolAddressToCheck ||
        typeof poolAddressToCheck !== 'string' ||
        !poolAddressToCheck.startsWith('secret1')
      ) {
        throw new Error('Invalid pool address format');
      }

      // Check if connected to the right network
      if (chainId !== 'pulsar-3' && chainId !== 'pulsar-2') {
        throw new Error(`Not connected to testnet. Current chain: ${chainId || 'unknown'}`);
      }

      // Method 1: Check if pool exists in the pools list
      if (pools && Array.isArray(pools) && pools.length > 0) {
        const foundInList = pools.some((pool) => pool.pair.contract_addr === poolAddressToCheck);

        if (foundInList) {
          setResult({
            exists: true,
            details: pools.find((p) => p.pair.contract_addr === poolAddressToCheck),
          });
          console.log('Pool found in pool list!');
          setChecking(false);
          return;
        }
      }

      // Method 2: Try to directly fetch pool data
      console.log('Pool not found in pool list, attempting direct query...');
      const validAddress = validatePoolAddress(poolAddressToCheck as SecretString);

      if (!validAddress) {
        throw new Error('Pool address validation failed');
      }

      const poolData = await fetchPoolData(validAddress, () => {});

      if (poolData && poolData.pairPoolData) {
        setResult({
          exists: true,
          details: poolData,
        });
        console.log('Pool found via direct query!');
      } else {
        setResult({
          exists: false,
          error: 'Pool not found via direct query',
        });
        console.log('Pool not found via direct query');
      }
    } catch (error) {
      console.error('Error checking pool:', error);
      setResult({
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-adamant-app-box rounded-lg p-6 max-w-3xl mx-auto my-4">
      <h2 className="text-xl font-bold mb-4">LP Pool Checker (Testnet)</h2>

      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <span className="font-medium text-gray-200 min-w-[120px]">Checking Pool:</span>
          <span className="font-mono text-sm bg-black/30 p-2 rounded-md overflow-x-auto">
            {poolAddressToCheck}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <span className="font-medium text-gray-200 min-w-[120px]">Chain ID:</span>
          <span
            className={`font-mono text-sm p-2 rounded-md ${
              chainId && chainId.includes('pulsar')
                ? 'bg-green-500/20 text-green-300'
                : 'bg-red-500/20 text-red-300'
            }`}
          >
            {chainId || 'Not connected'}
            {chainId && !chainId.includes('pulsar') && ' (Warning: Not testnet)'}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <span className="font-medium text-gray-200 min-w-[120px]">Wallet:</span>
          <span
            className={`font-mono text-sm p-2 rounded-md ${
              walletAddress ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}
          >
            {walletAddress
              ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}`
              : 'Not connected'}
          </span>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={checkPool}
          disabled={checking || !walletAddress}
          className={`px-4 py-2 rounded-lg bg-adamant-gradientBright hover:bg-adamant-gradientDark text-white font-medium 
                     ${checking || !walletAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {checking ? 'Checking...' : 'Check Pool'}
        </button>

        {!walletAddress && (
          <button
            onClick={() => connect()}
            className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 text-white font-medium"
          >
            Connect Wallet
          </button>
        )}
      </div>

      {result && (
        <div
          className={`border p-4 rounded-lg ${
            result.exists ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
          }`}
        >
          <h3 className="text-lg font-bold mb-2">
            {result.exists ? '✓ Pool Exists' : '✗ Pool Not Found'}
          </h3>

          {result.error && <div className="text-red-400 mb-2">{result.error}</div>}

          {result.exists && result.details && (
            <div className="bg-black/20 p-3 rounded-md mt-2">
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
