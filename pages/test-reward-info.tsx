import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import {
  checkStakingSetupFunctions,
  estimateRewardRate,
  generateEmissionReport,
  getRewardInfo,
  investigateAdminContract,
} from '@/lib/keplr/incentives';
import {
  discoverEmissionRates,
  investigateStakingContract,
} from '@/lib/keplr/incentives/contractInvestigation';
import React, { useState } from 'react';

const TestRewardInfo: React.FC = () => {
  const { secretjs } = useKeplrConnection();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the sSCRT/USDC.nbl LP token address
  const sScrtUsdcPair = LIQUIDITY_PAIRS.find((pair) => pair.symbol === 'sSCRT/USDC.nbl');
  const lpTokenAddress = sScrtUsdcPair?.lpToken || '';

  const testRewardInfo = async () => {
    if (!secretjs || !lpTokenAddress) {
      setError('SecretJS not connected or LP token address not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Testing reward info for LP token:', lpTokenAddress);

      // Test basic reward info
      const rewardInfo = await getRewardInfo({
        secretjs,
        lpToken: lpTokenAddress,
      });

      // Test reward rate estimation
      const rateEstimate = await estimateRewardRate({
        secretjs,
        lpToken: lpTokenAddress,
      });

      // Get current block height for context
      const latestBlock = await secretjs.query.tendermint.getLatestBlock({});
      const currentHeight = latestBlock.block?.header?.height;

      setResults({
        rewardInfo,
        rateEstimate,
        currentHeight,
        lpTokenAddress,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error testing reward info:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testAdminInvestigation = async () => {
    if (!secretjs || !lpTokenAddress) {
      setError('SecretJS not connected or LP token address not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🕵️ Starting admin and emission setup investigation...');

      // First get basic contract info
      const { getStakingContractInfo } = await import('@/utils/staking/stakingRegistry');
      const stakingContract = getStakingContractInfo(lpTokenAddress);

      if (!stakingContract) {
        throw new Error('No staking contract found for this LP token');
      }

      // Get basic staking info
      const investigation = await investigateStakingContract(secretjs, lpTokenAddress);

      // Investigate the admin contract
      const adminInvestigation = await investigateAdminContract(secretjs, investigation.admin);

      // Check staking setup functions
      const setupCheck = await checkStakingSetupFunctions(
        secretjs,
        investigation.stakingContract.address,
        investigation.stakingContract.codeHash
      );

      // Generate comprehensive report
      const emissionReport = generateEmissionReport({
        totalLocked: investigation.totalLocked,
        rewardSources: investigation.rewardSources,
        subscribers: investigation.subscribers,
        admin: investigation.admin,
        contractStatus: investigation.contractStatus,
        adminInvestigation,
        setupCheck,
      });

      setResults({
        investigation,
        adminInvestigation,
        setupCheck,
        emissionReport,
        lpTokenAddress,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error in admin investigation:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testAdvancedInvestigation = async () => {
    if (!secretjs || !lpTokenAddress) {
      setError('SecretJS not connected or LP token address not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🕵️ Starting advanced contract investigation...');

      // Run full investigation
      const investigation = await investigateStakingContract(secretjs, lpTokenAddress);

      // Discover emission rates
      const emissionAnalysis = await discoverEmissionRates(secretjs, investigation);

      setResults({
        investigation,
        emissionAnalysis,
        lpTokenAddress,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error in advanced investigation:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testRawContractQueries = async () => {
    if (!secretjs || !lpTokenAddress) {
      setError('SecretJS not connected or LP token address not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get staking contract info
      const { getStakingContractInfo } = await import('@/utils/staking/stakingRegistry');
      const stakingContract = getStakingContractInfo(lpTokenAddress);

      if (!stakingContract) {
        throw new Error('No staking contract found for this LP token');
      }

      console.log(
        '🔍 Testing raw contract queries for staking contract:',
        stakingContract.stakingAddress
      );

      // Test all available queries
      const queries = [
        { name: 'token_info', query: { token_info: {} } },
        { name: 'admin', query: { admin: {} } },
        { name: 'contract_status', query: { contract_status: {} } },
        { name: 'reward_token', query: { reward_token: {} } },
        { name: 'incentivized_token', query: { incentivized_token: {} } },
        { name: 'total_locked', query: { total_locked: {} } },
        { name: 'subscribers', query: { subscribers: {} } },
        { name: 'reward_sources', query: { reward_sources: {} } },
      ];

      const queryResults: any = {};

      for (const { name, query } of queries) {
        try {
          console.log(`Querying ${name}...`);
          const result = await secretjs.query.compute.queryContract({
            contract_address: stakingContract.stakingAddress,
            code_hash: stakingContract.stakingCodeHash,
            query,
          });
          queryResults[name] = result;
          console.log(`✅ ${name}:`, result);
        } catch (err) {
          console.log(`❌ ${name} failed:`, err);
          queryResults[name] = { error: err instanceof Error ? err.message : 'Unknown error' };
        }
      }

      // Also try to get the reward token contract info if we have it
      let rewardTokenInfo = null;
      if (queryResults.reward_token && !queryResults.reward_token.error) {
        try {
          const rewardTokenAddress = queryResults.reward_token.reward_token?.token?.address;
          const rewardTokenHash = queryResults.reward_token.reward_token?.token?.contract_hash;

          if (rewardTokenAddress && rewardTokenHash) {
            console.log('🔍 Querying reward token info:', rewardTokenAddress);
            rewardTokenInfo = await secretjs.query.compute.queryContract({
              contract_address: rewardTokenAddress,
              code_hash: rewardTokenHash,
              query: { token_info: {} },
            });
            console.log('✅ Reward token info:', rewardTokenInfo);
          }
        } catch (err) {
          console.log('❌ Reward token query failed:', err);
          rewardTokenInfo = { error: err instanceof Error ? err.message : 'Unknown error' };
        }
      }

      setResults({
        stakingContract,
        queryResults,
        rewardTokenInfo,
        lpTokenAddress,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error testing raw contract queries:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Staking Contract Investigation</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Contract Details</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>LP Token:</strong> {lpTokenAddress || 'Not found'}
            </p>
            <p>
              <strong>Pair:</strong> {sScrtUsdcPair?.symbol || 'Not found'}
            </p>
            <p>
              <strong>Connected:</strong> {secretjs ? '✅ Yes' : '❌ No'}
            </p>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={testRewardInfo}
            disabled={loading || !secretjs}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Testing...' : 'Test Reward Info Functions'}
          </button>

          <button
            onClick={testRawContractQueries}
            disabled={loading || !secretjs}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Testing...' : 'Test Raw Contract Queries'}
          </button>

          <button
            onClick={testAdvancedInvestigation}
            disabled={loading || !secretjs}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Testing...' : 'Advanced Investigation'}
          </button>

          <button
            onClick={testAdminInvestigation}
            disabled={loading || !secretjs}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Testing...' : 'Investigate Admin & Emission Setup'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <h3 className="text-red-400 font-semibold mb-2">Error</h3>
            <pre className="text-red-300 text-sm whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {results && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">📊 Results</h3>
            <div className="bg-gray-900 rounded p-4 overflow-auto">
              <pre className="text-sm text-green-400 whitespace-pre-wrap">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-8 bg-yellow-900/30 border border-yellow-500 rounded-lg p-6">
          <h3 className="text-yellow-400 font-semibold mb-2">🕵️ Investigation Notes</h3>
          <ul className="text-yellow-200 text-sm space-y-1">
            <li>
              • <strong>total_locked</strong>: Shows how many LP tokens are currently staked
            </li>
            <li>
              • <strong>reward_token</strong>: Should show bADMT contract address and hash
            </li>
            <li>
              • <strong>reward_sources</strong>: Shows contracts that provide rewards (might reveal
              emission logic)
            </li>
            <li>
              • <strong>contract_status</strong>: Shows if the contract is active/paused
            </li>
            <li>
              • <strong>admin</strong>: Shows who controls the contract
            </li>
            <li>• Check browser console for detailed logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestRewardInfo;
