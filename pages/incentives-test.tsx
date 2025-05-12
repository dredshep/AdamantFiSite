import NetworkSwitcher from '@/components/NetworkSwitcher';
import ViewingKeyCreator from '@/components/ViewingKeyCreator';
import { ErrorBoundary, KeplrErrorDisplay, debugKeplrQuery } from '@/lib/keplr';
import { claimRewards } from '@/lib/keplr/incentives/claimRewards';
import { getRewards } from '@/lib/keplr/incentives/getRewards';
import { getStakedBalance } from '@/lib/keplr/incentives/getStakedBalance';
import { stakeLP } from '@/lib/keplr/incentives/stakeLP';
import { unstakeLP } from '@/lib/keplr/incentives/unstakeLP';
import { getSecretNetworkEnvVars } from '@/utils/env';
import { useState } from 'react';
import { SecretNetworkClient } from 'secretjs';

// Extend the global Window interface properly
// declare global {
//   // eslint-disable-next-line @typescript-eslint/no-empty-interface
//   interface Window extends KeplrWindow {}
// }

/**
 * Get incentives contract info from environment variables using the centralized env utility
 */
const getIncentivesContractInfo = (): { address: string; code_hash: string } => {
  const env = getSecretNetworkEnvVars();

  return {
    address: env.INCENTIVES_CONTRACT_ADDRESS,
    code_hash: env.INCENTIVES_CONTRACT_HASH,
  };
};

/**
 * Detailed Error Display component
 */
function DetailedErrorDisplay({ error }: { error: Error | null }): JSX.Element | null {
  if (error === null) return null;
  return <KeplrErrorDisplay error={error} isExpanded={true} />;
}

// Create a simplified type for the transaction result
// interface TransactionResult {
//   code: number;
//   transactionHash: string;
//   rawLog?: string;
// }

// Try to get Keplr's viewing key with advanced error handling
const getKeplrViewingKey = async (chainId: string, contractAddress: string): Promise<string> => {
  if (!window.keplr) {
    throw new Error('Keplr extension not installed');
  }

  try {
    console.log('Attempting to get viewing key from Keplr...');
    const key = await window.keplr.getSecret20ViewingKey(chainId, contractAddress);
    console.log('Got viewing key from Keplr:', key ? 'Key exists' : 'Key is empty');
    return key;
  } catch (error) {
    console.error('Error getting viewing key:', error);
    throw new Error(
      'Unable to get viewing key. Please register the token with Keplr and set a viewing key.'
    );
  }
};

// A function to refresh Keplr connection (to be used after timeout)
// const refreshKeplrConnection = async (chainId: string): Promise<void> => {
//   try {
//     // Attempt to reconnect to Keplr to refresh the viewing key
//     if (window.keplr) {
//       // Disconnect (simulate closing extension)
//       try {
//         await window.keplr.disable(chainId);
//         console.log('Disabled Keplr connection to refresh viewing key');
//       } catch (error) {
//         console.log('Error disabling Keplr:', error);
//       }

//       // Re-enable to force a refresh of cached data
//       try {
//         await window.keplr.enable(chainId);
//         console.log('Re-enabled Keplr connection to refresh viewing key cache');
//       } catch (error) {
//         console.log('Error re-enabling Keplr:', error);
//       }
//     }
//   } catch (error) {
//     console.log("Error refreshing Keplr's viewing key cache:", error);
//   }
// };

/**
 * Main Incentives Test Component
 */
export default function IncentivesTest(): JSX.Element {
  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [balanceResult, setBalanceResult] = useState<string | null>(null);
  const [rewardsResult, setRewardsResult] = useState<string | null>(null);
  const [stakeResult, setStakeResult] = useState<string | null>(null);
  const [unstakeResult, setUnstakeResult] = useState<string | null>(null);
  const [claimResult, setClaimResult] = useState<string | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [network, setNetwork] = useState<string>('');
  const [viewingKeyMessage, setViewingKeyMessage] = useState<string | null>(null);
  const [contractExistsResult, setContractExistsResult] = useState<string | null>(null);

  const setLoadingState = (operation: string, loading: boolean): void => {
    setIsLoading((prev) => ({ ...prev, [operation]: loading }));
  };

  const isOperationLoading = (operation: string): boolean => {
    return Boolean(isLoading[operation]);
  };

  // Handle errors consistently
  const handleError = (err: unknown, operation: string): Error => {
    console.error(`${operation} error:`, err);

    // Handle different error types consistently
    if (err instanceof Error) {
      return err;
    } else if (typeof err === 'string') {
      return new Error(err);
    } else if (typeof err === 'object' && err !== null) {
      // Convert object to a readable format
      try {
        return new Error(JSON.stringify(err));
      } catch {
        return new Error(`${operation} failed with an object that couldn't be stringified`);
      }
    } else {
      return new Error(`${operation} failed with an unknown error: ${String(err)}`);
    }
  };

  // Connect to Keplr
  const connect = async (): Promise<void> => {
    try {
      setLoadingState('connect', true);
      setLastError(null);

      // Get network configuration
      const envVars = getSecretNetworkEnvVars();
      setNetwork(envVars.CHAIN_ID);

      // Use enhanced error handling
      await debugKeplrQuery(
        async () => {
          if (typeof window === 'undefined' || window.keplr === undefined) {
            throw new Error('Keplr extension not installed');
          }

          await window.keplr.enable(envVars.CHAIN_ID);
          const offlineSigner = window.keplr.getOfflineSigner(envVars.CHAIN_ID);
          const accounts = await offlineSigner.getAccounts();

          if (accounts.length === 0 || accounts[0] === undefined) {
            throw new Error('No accounts found in Keplr wallet');
          }

          const address = accounts[0].address;

          const client = new SecretNetworkClient({
            url: envVars.LCD_URL,
            chainId: envVars.CHAIN_ID,
            wallet: offlineSigner,
            walletAddress: address,
          });

          setSecretjs(client);
          setWallet(address);
          return client;
        },
        { operation: 'connect' }
      );
    } catch (err) {
      const error = handleError(err, 'Connection');
      setLastError(error);
    } finally {
      setLoadingState('connect', false);
    }
  };

  // Handler for onClick that doesn't return a Promise
  const handleConnect = (): void => {
    void connect();
  };

  // Get staked balance
  const getStaked = async (): Promise<void> => {
    if (secretjs === null || wallet === null || wallet === '') {
      setLastError(new Error('Please connect to Keplr first'));
      return;
    }

    try {
      setLoadingState('getStaked', true);
      setLastError(null);

      // Get contract info for the incentives contract
      const contractInfo = getIncentivesContractInfo();
      console.log('Using incentives contract:', contractInfo.address);

      // Use the incentives contract itself as the LP token for testing
      // In a real scenario, this would be an actual LP token address from a pair contract
      const lpToken = contractInfo.address;

      // Get the viewing key for the contract
      let viewingKey = '';

      try {
        const chainId = process.env['NEXT_PUBLIC_CHAIN_ID'] ?? '';
        if (chainId) {
          viewingKey = await getKeplrViewingKey(chainId, contractInfo.address);
        }
      } catch (error) {
        console.error('Error getting viewing key:', error);
        throw new Error(
          'Unable to get viewing key. Please register the token with Keplr first and set a viewing key using the "Create Viewing Key" button.'
        );
      }

      if (!viewingKey) {
        throw new Error(
          'No viewing key available. Please set a viewing key using the "Create Viewing Key" button.'
        );
      }

      console.log(
        `Querying staked balance for wallet ${wallet} with LP token ${lpToken} and viewing key`
      );

      const balance = await getStakedBalance({
        secretjs,
        lpToken,
        address: wallet,
        viewingKey,
      });

      console.log(`Retrieved staked balance:`, balance);

      setBalanceResult(balance);
    } catch (err) {
      const error = handleError(err, 'Get staked balance');
      setLastError(error);
      setBalanceResult(null);
    } finally {
      setLoadingState('getStaked', false);
    }
  };

  // Handler for onClick that doesn't return a Promise
  const handleGetStaked = (): void => {
    void getStaked();
  };

  // Get rewards
  const getRewardsBalance = async (): Promise<void> => {
    if (secretjs === null || wallet === null || wallet === '') {
      setLastError(new Error('Please connect to Keplr first'));
      return;
    }

    try {
      setLoadingState('getRewards', true);
      setLastError(null);

      // Get contract info and validate it exists
      const contractInfo = getIncentivesContractInfo();

      // Get the viewing key for the contract
      let viewingKey = '';

      try {
        const chainId = process.env['NEXT_PUBLIC_CHAIN_ID'] ?? '';
        if (chainId) {
          viewingKey = await getKeplrViewingKey(chainId, contractInfo.address);
        }
      } catch (error) {
        console.error('Error getting viewing key:', error);
        throw new Error(
          'Unable to get viewing key. Please register the token with Keplr first and set a viewing key using the "Create Viewing Key" button.'
        );
      }

      if (!viewingKey) {
        throw new Error(
          'No viewing key available. Please set a viewing key using the "Create Viewing Key" button.'
        );
      }

      // Create a contract info object that matches the expected type
      const stakeContract = {
        address: contractInfo.address,
        code_hash: contractInfo.code_hash,
      };

      console.log(
        `Querying rewards for wallet ${wallet} with contract ${contractInfo.address} and viewing key`
      );

      const rewards = await getRewards({
        secretjs,
        lpToken: stakeContract.address,
        address: wallet,
        viewingKey,
        height: 1, // Current block height, could be fetched from chain
      });

      console.log(`Retrieved rewards:`, rewards);

      setRewardsResult(rewards);
    } catch (err) {
      const error = handleError(err, 'Get rewards');
      setLastError(error);
      setRewardsResult(null);
    } finally {
      setLoadingState('getRewards', false);
    }
  };

  // Handler for onClick that doesn't return a Promise
  const handleGetRewards = (): void => {
    void getRewardsBalance();
  };

  // Stake LP tokens
  const stake = async (): Promise<void> => {
    if (secretjs === null || wallet === null || wallet === '') {
      setLastError(new Error('Please connect to Keplr first'));
      return;
    }

    try {
      setLoadingState('stake', true);
      setLastError(null);

      // Get contract info and validate it exists
      const contractInfo = getIncentivesContractInfo();
      const amount = '1000'; // Small amount for testing

      // Create contract info objects that match the expected types
      // const stakeContract = {
      //   address: contractInfo.address,
      //   code_hash: contractInfo.code_hash,
      // };

      // For testing, use the actual LP token from our documentation
      // This should be replaced with an actual LP token in production
      const lpTokenContract = {
        address: contractInfo.address, // Using the same address for testing
        code_hash: contractInfo.code_hash,
      };

      const result = await stakeLP({
        secretjs,
        lpToken: lpTokenContract.address,
        amount,
      });

      setStakeResult(JSON.stringify(result));
    } catch (err) {
      const error = handleError(err, 'Stake');
      setLastError(error);
      setStakeResult(null);
    } finally {
      setLoadingState('stake', false);
    }
  };

  // Handler for onClick that doesn't return a Promise
  const handleStake = (): void => {
    void stake();
  };

  // Unstake LP tokens
  const unstake = async (): Promise<void> => {
    if (secretjs === null || wallet === null || wallet === '') {
      setLastError(new Error('Please connect to Keplr first'));
      return;
    }

    try {
      setLoadingState('unstake', true);
      setLastError(null);

      // Get contract info and validate it exists
      const contractInfo = getIncentivesContractInfo();
      const amount = '1000'; // Small amount for testing

      // Create a contract info object that matches the expected type
      const stakeContract = {
        address: contractInfo.address,
        code_hash: contractInfo.code_hash,
      };

      const result = await unstakeLP({
        secretjs,
        lpToken: stakeContract.address,
        amount,
      });

      setUnstakeResult(JSON.stringify(result));
    } catch (err) {
      const error = handleError(err, 'Unstake');
      setLastError(error);
      setUnstakeResult(null);
    } finally {
      setLoadingState('unstake', false);
    }
  };

  // Handler for onClick that doesn't return a Promise
  const handleUnstake = (): void => {
    void unstake();
  };

  // Claim rewards
  const claim = async (): Promise<void> => {
    if (secretjs === null || wallet === null || wallet === '') {
      setLastError(new Error('Please connect to Keplr first'));
      return;
    }

    try {
      setLoadingState('claim', true);
      setLastError(null);

      // Get contract info and validate it exists
      const contractInfo = getIncentivesContractInfo();

      // Create a contract info object that matches the expected type
      const stakeContract = {
        address: contractInfo.address,
        code_hash: contractInfo.code_hash,
      };

      const result = await claimRewards({
        secretjs,
        lpStakingContract: stakeContract,
      });

      setClaimResult(JSON.stringify(result));
    } catch (err) {
      const error = handleError(err, 'Claim rewards');
      setLastError(error);
      setClaimResult(null);
    } finally {
      setLoadingState('claim', false);
    }
  };

  // Handler for onClick that doesn't return a Promise
  const handleClaim = (): void => {
    void claim();
  };

  // Replace the setupTokenAndViewingKey function with a simpler registerToken function
  const registerToken = async (): Promise<void> => {
    if (secretjs === null || wallet === null || wallet === '') {
      setLastError(new Error('Please connect to Keplr first'));
      return;
    }

    try {
      setLoadingState('register', true);
      setLastError(null);

      const contractInfo = getIncentivesContractInfo();

      if (!window.keplr) {
        throw new Error('Keplr extension not installed');
      }

      // Get chain ID from environment
      const chainId = process.env['NEXT_PUBLIC_CHAIN_ID'] ?? '';
      if (!chainId) {
        throw new Error('Chain ID not configured');
      }

      console.log(
        `Registering token ${contractInfo.address} with Keplr, code hash: ${contractInfo.code_hash}`
      );
      await window.keplr.suggestToken(chainId, contractInfo.address, contractInfo.code_hash);
      console.log('Token registration successful');

      setStakeResult('Token registered successfully! Now create a viewing key below.');
    } catch (err) {
      const error = handleError(err, 'Register Token');
      setLastError(error);
    } finally {
      setLoadingState('register', false);
    }
  };

  // Handler for onClick that doesn't return a Promise
  const handleRegisterToken = (): void => {
    void registerToken();
  };

  // Test if the incentives contract exists without token registration
  const testContractExists = async (): Promise<void> => {
    if (secretjs === null || wallet === null || wallet === '') {
      setLastError(new Error('Please connect to Keplr first'));
      return;
    }

    try {
      setLoadingState('testContract', true);
      setLastError(null);

      const contractInfo = getIncentivesContractInfo();

      // Use the secretjs client to query contract info
      // This doesn't require token registration or viewing keys
      try {
        const queryResult = await secretjs.query.compute.codeHashByContractAddress({
          contract_address: contractInfo.address,
        });

        // Check if code_hash exists and is not empty
        const codeHash = queryResult?.code_hash;
        if (codeHash != null && typeof codeHash === 'string' && codeHash.length > 0) {
          console.log('Contract exists!', queryResult);
          setContractExistsResult(`Contract exists! Code hash: ${codeHash}`);
        } else {
          setContractExistsResult('Contract exists but no code hash returned');
        }
      } catch (queryErr) {
        console.error('Error querying contract:', queryErr);
        setContractExistsResult('Contract not found or error querying contract');
      }
    } catch (err) {
      const error = handleError(err, 'Test Contract');
      setLastError(error);
      setContractExistsResult('Contract query failed');
    } finally {
      setLoadingState('testContract', false);
    }
  };

  // Handler for onClick that doesn't return a Promise
  const handleTestContract = (): void => {
    void testContractExists();
  };

  // Handle viewing key creation success
  const handleViewingKeySuccess = (txHash: string): void => {
    setViewingKeyMessage(`Viewing key created successfully! Transaction hash: ${txHash}`);
    setLastError(null);
  };

  // Handle viewing key creation error
  const handleViewingKeyError = (error: Error): void => {
    setLastError(error);
    setViewingKeyMessage(null);
  };

  // Create wallet display string
  const walletDisplay = wallet !== null && wallet !== '' ? wallet : null;

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 max-w-4xl bg-gray-900 text-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-white">Incentives Testing Dashboard</h1>

        {/* Network Switcher */}
        <NetworkSwitcher />

        {/* Connection Status */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-white">Connection Status</h2>
          <div className="mb-4">
            {walletDisplay !== null ? (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Connected to: {walletDisplay}</span>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Not connected</span>
              </div>
            )}
            {network && (
              <div className="mt-2">
                <span className="text-gray-400">Network: </span>
                <span className="text-blue-400">{network}</span>
              </div>
            )}
          </div>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleConnect}
              disabled={isOperationLoading('connect')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:bg-gray-700 disabled:text-gray-500"
            >
              {isOperationLoading('connect') ? 'Connecting...' : 'Connect to Keplr'}
            </button>

            <button
              onClick={handleTestContract}
              disabled={isOperationLoading('testContract') || walletDisplay === null}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:bg-gray-700 disabled:text-gray-500"
            >
              {isOperationLoading('testContract') ? 'Testing...' : 'Test Contract Exists'}
            </button>

            <button
              onClick={handleRegisterToken}
              disabled={isOperationLoading('register') || walletDisplay === null}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:bg-gray-700 disabled:text-gray-500"
            >
              {isOperationLoading('register') ? 'Registering...' : 'Register Token with Keplr'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {lastError !== null && <DetailedErrorDisplay error={lastError} />}

        {/* Viewing Key Status */}
        {viewingKeyMessage !== null && viewingKeyMessage !== '' && (
          <div className="mb-6 p-4 rounded-lg border border-green-600 bg-green-900 bg-opacity-30 text-green-100">
            <h3 className="text-lg font-semibold mb-2 text-green-300">
              <span className="mr-2">✓</span>Viewing Key Created
            </h3>
            <p className="text-sm">{viewingKeyMessage}</p>
            <p className="mt-2 text-sm">
              You can now use the "Get Staked Balance" and "Get Rewards" functions.
            </p>
          </div>
        )}

        {/* Viewing Key Creator */}
        {secretjs !== null && wallet !== null && (
          <div className="mb-6">
            <ViewingKeyCreator
              secretjs={secretjs}
              contractAddress={getIncentivesContractInfo().address}
              contractHash={getIncentivesContractInfo().code_hash}
              onSuccess={handleViewingKeySuccess}
              onError={handleViewingKeyError}
            />
          </div>
        )}

        {/* Function Testing Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Get Staked Balance */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-white">Get Staked Balance</h3>
            <button
              onClick={handleGetStaked}
              disabled={isOperationLoading('getStaked') || walletDisplay === null}
              className="bg-purple-700 hover:bg-purple-800 text-white font-medium py-2 px-4 rounded transition-colors mb-4 disabled:bg-gray-700 disabled:text-gray-500"
            >
              {isOperationLoading('getStaked') ? 'Loading...' : 'Get Staked Balance'}
            </button>
            {balanceResult !== null && (
              <div className="mt-2">
                <h4 className="font-medium text-gray-300">Result:</h4>
                <div className="bg-gray-900 p-3 rounded border border-gray-700 mt-1 font-mono text-sm text-gray-300">
                  {balanceResult}
                </div>
              </div>
            )}
          </div>

          {/* Get Rewards */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-white">Get Rewards</h3>
            <button
              onClick={handleGetRewards}
              disabled={isOperationLoading('getRewards') || walletDisplay === null}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded transition-colors mb-4 disabled:bg-gray-700 disabled:text-gray-500"
            >
              {isOperationLoading('getRewards') ? 'Loading...' : 'Get Rewards'}
            </button>
            {rewardsResult !== null && (
              <div className="mt-2">
                <h4 className="font-medium text-gray-300">Result:</h4>
                <div className="bg-gray-900 p-3 rounded border border-gray-700 mt-1 font-mono text-sm text-gray-300">
                  {rewardsResult}
                </div>
              </div>
            )}
          </div>

          {/* Stake LP */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-white">Stake LP Tokens</h3>
            <button
              onClick={handleStake}
              disabled={isOperationLoading('stake') || walletDisplay === null}
              className="bg-green-700 hover:bg-green-800 text-white font-medium py-2 px-4 rounded transition-colors mb-4 disabled:bg-gray-700 disabled:text-gray-500"
            >
              {isOperationLoading('stake') ? 'Staking...' : 'Stake 1000 LP Tokens'}
            </button>
            {stakeResult !== null && (
              <div className="mt-2">
                <h4 className="font-medium text-gray-300">Result:</h4>
                <div className="bg-gray-900 p-3 rounded border border-gray-700 mt-1 font-mono text-sm break-all text-gray-300">
                  {stakeResult}
                </div>
              </div>
            )}
          </div>

          {/* Unstake LP */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-white">Unstake LP Tokens</h3>
            <button
              onClick={handleUnstake}
              disabled={isOperationLoading('unstake') || walletDisplay === null}
              className="bg-orange-700 hover:bg-orange-800 text-white font-medium py-2 px-4 rounded transition-colors mb-4 disabled:bg-gray-700 disabled:text-gray-500"
            >
              {isOperationLoading('unstake') ? 'Unstaking...' : 'Unstake 1000 LP Tokens'}
            </button>
            {unstakeResult !== null && (
              <div className="mt-2">
                <h4 className="font-medium text-gray-300">Result:</h4>
                <div className="bg-gray-900 p-3 rounded border border-gray-700 mt-1 font-mono text-sm break-all text-gray-300">
                  {unstakeResult}
                </div>
              </div>
            )}
          </div>

          {/* Claim Rewards */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-white">Claim Rewards</h3>
            <button
              onClick={handleClaim}
              disabled={isOperationLoading('claim') || walletDisplay === null}
              className="bg-pink-700 hover:bg-pink-800 text-white font-medium py-2 px-4 rounded transition-colors mb-4 disabled:bg-gray-700 disabled:text-gray-500"
            >
              {isOperationLoading('claim') ? 'Claiming...' : 'Claim Rewards'}
            </button>
            {claimResult !== null && (
              <div className="mt-2">
                <h4 className="font-medium text-gray-300">Result:</h4>
                <div className="bg-gray-900 p-3 rounded border border-gray-700 mt-1 font-mono text-sm break-all text-gray-300">
                  {claimResult}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technical Info */}
        <div className="bg-gray-800 text-gray-200 p-4 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-white">Technical Information</h2>
          <div className="text-sm">
            <p className="mb-1">🔹 Testing environment for Secret Network incentives</p>
            <p className="mb-1">🔹 Enhanced error handling with detailed diagnostics</p>
            <p className="mb-1">
              🔹 Incentives Contract:{' '}
              {process.env['NEXT_PUBLIC_INCENTIVES_CONTRACT_ADDRESS'] ?? 'Not configured'}
            </p>
            <p className="mb-1">🔹 Network: {network || 'Not connected'}</p>
            <p className="mb-1">🔹 LP Token: Using incentives contract address for testing</p>
            <p className="mb-1">🔹 Query Format:</p>
            <pre className="bg-gray-900 p-2 rounded text-xs overflow-auto mt-1">
              {`Balance Query: { "balance": { "address": "<wallet>", "key": "<viewing_key>" } }
Rewards Query: { "rewards": { "address": "<wallet>", "key": "<viewing_key>", "height": <num> } }`}
            </pre>
          </div>
        </div>

        {/* Viewing Key Guide */}
        <div className="mt-6 bg-gray-800 text-gray-200 p-4 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-white">Viewing Key Guide</h2>
          <div className="text-sm">
            <p className="mb-2">
              If the "Register Token & Set Viewing Key" button doesn't automatically create a
              viewing key, follow these steps:
            </p>

            <ol className="list-decimal list-inside ml-4 space-y-2">
              <li>Open the Keplr extension by clicking its icon in your browser toolbar</li>
              <li>Click on "Secret Network" to select the network</li>
              <li>
                Find the token with address{' '}
                <span className="bg-gray-900 px-1 py-0.5 rounded text-xs">
                  {process.env['NEXT_PUBLIC_INCENTIVES_CONTRACT_ADDRESS'] ?? 'Check env config'}
                </span>
              </li>
              <li>Click on the 3 dots (⋮) menu next to the token</li>
              <li>Select "Set Viewing Key"</li>
              <li>Choose a viewing key or use the auto-generated one</li>
              <li>Click "Save"</li>
              <li>
                Return to this page and try the "Get Staked Balance" or "Get Rewards" button again
              </li>
            </ol>

            <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded">
              <p className="font-semibold text-blue-300">What is a viewing key?</p>
              <p className="mt-1">
                Viewing keys are an encrypted password that allows applications to view your token
                balances while maintaining the privacy of Secret Network. You need to set a viewing
                key for each token you want to interact with.
              </p>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-6 bg-gray-800 text-gray-200 p-4 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-white">Debug Info</h2>
          <div className="text-sm">
            <p>Check the browser console for detailed logs of contract queries and responses.</p>
            <p className="mt-2">If you encounter a viewing key error:</p>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>This contract requires a viewing key for authenticated queries</li>
              <li>Set a viewing key for your address using the contract admin</li>
              <li>Read operations like balance and rewards checks are authenticated</li>
              <li>Public queries like total_locked don't require authentication</li>
            </ul>
            <p className="mt-2">For 500 errors:</p>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>The contract may not exist at the provided address on this network</li>
              <li>The code hash might be incorrect</li>
              <li>The network RPC endpoint might be down</li>
            </ul>
          </div>
        </div>

        {/* Display contract exists result only when it has a value */}
        {contractExistsResult !== null && contractExistsResult.length > 0 && (
          <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-700">
            <span className="font-medium">Contract Check Result: </span>
            <span
              className={
                contractExistsResult.indexOf('exists') >= 0 ? 'text-green-400' : 'text-amber-400'
              }
            >
              {contractExistsResult}
            </span>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
