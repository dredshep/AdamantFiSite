import AppLayout from '@/components/app/Global/AppLayout';
import DepositForm from '@/components/app/Pages/Pool/DepositForm';
import WithdrawForm from '@/components/app/Pages/Pool/WithdrawForm';
import PoolTabNavigation from '@/components/app/Shared/Navigation/PoolTabNavigation';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { usePoolsAndTokens } from '@/hooks/usePoolsAndTokens';
import { useBalanceFetcherStore } from '@/store/balanceFetcherStore';
import { usePoolStore } from '@/store/forms/poolStore';
import { getStakingContractInfoForPool } from '@/utils/staking/stakingRegistry';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { getTokenSymbol } from '../../utils/token/tokenInfo';

function NotFoundState() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
        <div className="bg-adamant-app-box p-6 rounded-xl flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <div className="text-lg font-medium text-gray-200">Pool not found</div>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="mt-2 bg-adamant-app-box-lighter text-white px-6 py-2 rounded-xl font-semibold 
                       hover:bg-white/10 transition-colors"
            >
              Go Back
            </button>
            <Link
              href="/pools"
              className="mt-2 bg-white text-black px-6 py-2 rounded-xl font-semibold 
                       hover:bg-gray-100 transition-colors"
            >
              All Pools
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function PoolPage() {
  const router = useRouter();
  const { pools, loading, error } = usePoolsAndTokens();
  const { setSelectedPool } = usePoolStore();
  const { pool: poolAddress } = router.query;
  const { walletAddress } = useKeplrConnection();
  const addToQueue = useBalanceFetcherStore((state) => state.addToQueue);

  // All hooks must be at the top level
  useEffect(() => {
    if (!router.isReady) return;
    if (typeof poolAddress !== 'string' || !poolAddress.startsWith('secret1')) {
      console.error('Invalid pool address:', poolAddress);
      return;
    }
    if (!Array.isArray(pools) || pools.length === 0) return;

    const liquidityPair = LIQUIDITY_PAIRS.find((p) => p.pairContract === poolAddress);

    if (!liquidityPair) {
      console.error('Pool not found in LIQUIDITY_PAIRS:', {
        poolAddress,
        availablePairs: LIQUIDITY_PAIRS.map((p) => p.pairContract),
      });
      return;
    }

    setSelectedPool(liquidityPair);

    // PRELOAD BALANCE DATA for all related tokens to prevent 429 on tab switches
    if (walletAddress && liquidityPair) {
      console.log('🔄 Preloading balance data for pool tokens to prevent 429 on tab switches');
      // Fetch balances for both pool tokens with low priority to fill cache
      addToQueue(liquidityPair.token0, 'PoolPage:Preload:Token0', 'low');
      addToQueue(liquidityPair.token1, 'PoolPage:Preload:Token1', 'low');
      // Also preload LP token balance for staking
      addToQueue(liquidityPair.lpToken, 'PoolPage:Preload:LPToken', 'low');
    }
  }, [poolAddress, pools, setSelectedPool, router.isReady, walletAddress, addToQueue]);

  // Handle staking tab redirect
  useEffect(() => {
    if (!router.isReady || typeof poolAddress !== 'string') return;

    const { tab } = router.query;
    if (tab === 'staking') {
      // User is trying to access the legacy staking tab, redirect to new staking page
      const stakingInfo = getStakingContractInfoForPool(poolAddress);
      if (stakingInfo) {
        void router.replace(`/staking/${stakingInfo.stakingAddress}`);
      } else {
        // If no staking contract found, redirect to pool page without tab parameter
        void router.replace(`/pool/${poolAddress}`);
      }
    }
  }, [router.isReady, router.query.tab, poolAddress, router]);

  // Handle loading states and errors
  if (!router.isReady || loading) {
    return (
      <AppLayout>
        <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
          <LoadingSpinner size={40} />
          <div className="text-lg font-medium text-gray-200">
            {!router.isReady ? 'Loading...' : 'Loading pools...'}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Handle invalid pool address
  if (typeof poolAddress !== 'string' || !poolAddress.startsWith('secret1')) {
    return <NotFoundState />;
  }

  // Handle empty pools
  if (!Array.isArray(pools) || pools.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col gap-2 w-full items-center pt-10">
          <div className="text-lg font-semibold">No pools found</div>
          <Link href="/pools" className="text-black bg-white p-4 py-2 rounded-xl text-xl font-bold">
            Back to Pools
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Handle pool not found
  const currentPool = pools.find((p) => p.pair.contract_addr === poolAddress);
  if (!currentPool) {
    console.error('Pool not found in render:', {
      poolAddress,
      availablePools: pools.map((p) => p.pair.contract_addr),
    });
    return <NotFoundState />;
  }

  // Handle error state
  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
          <div className="bg-red-500/10 p-6 rounded-xl flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <div className="text-lg font-medium text-red-500">
              {error.message || 'An error occurred'}
            </div>
            <Link
              href="/pools"
              className="mt-2 bg-white text-black px-6 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Back to Pools
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const symbolA = getTokenSymbol(currentPool.token0.address);
  const symbolB = getTokenSymbol(currentPool.token1.address);

  // Get the current tab from URL params or default to deposit
  const currentTab = (router.query.tab as string) || 'deposit';

  // Render main content
  return (
    <AppLayout>
      <PoolTabNavigation
        poolAddress={typeof poolAddress === 'string' ? poolAddress : undefined}
        token0Symbol={symbolA}
        token1Symbol={symbolB}
        activeTab={currentTab as 'deposit' | 'withdraw' | 'staking'}
        depositContent={
          <DepositForm
            initialAmount0={router.query.amount0 as string}
            initialAmount1={router.query.amount1 as string}
            initialToken={router.query.token as string}
            initialAmount={router.query.amount as string}
          />
        }
        withdrawContent={<WithdrawForm />}
      />
    </AppLayout>
  );
}
