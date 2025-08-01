import { Breadcrumb } from '@/components/app/Breadcrumb';
import AppLayout from '@/components/app/Global/AppLayout';
import DepositForm from '@/components/app/Pages/Pool/DepositForm';
import StakingForm from '@/components/app/Pages/Pool/StakingForm';
import WithdrawForm from '@/components/app/Pages/Pool/WithdrawForm';
import SparklyTab from '@/components/app/Pages/Pools/SparklyTab';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { usePoolsAndTokens } from '@/hooks/usePoolsAndTokens';
import ErrorBoundary from '@/lib/keplr/components/ErrorBoundary';
import { usePoolStore } from '@/store/forms/poolStore';
import * as Tabs from '@radix-ui/react-tabs';
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
  }, [poolAddress, pools, setSelectedPool, router.isReady]);

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

  // Render main content
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto mt-12 flex flex-col gap-4">
        <div className="px-2.5">
          <div className="max-w-full md:max-w-xl mx-auto">
            <Breadcrumb linkPath="/pools" linkText="Pools" currentText={`${symbolA}-${symbolB}`} />
          </div>

          <div className="mt-4 bg-adamant-app-box rounded-xl max-w-full md:max-w-xl mx-auto mb-4">
            <Tabs.Root
              className="flex flex-col"
              defaultValue={(router.query.tab as string) || 'deposit'}
            >
              <Tabs.List className="flex mb-4 p-2.5 gap-2.5" aria-label="Manage your liquidity">
                <Tabs.Trigger
                  key="deposit"
                  className="flex-1 bg-adamant-app-box-lighter px-4 py-4 rounded-xl text-white/75
                           data-[state=active]:text-black data-[state=active]:bg-white/75
                           hover:bg-white/5 transition-colors font-medium tracking-wide"
                  value="deposit"
                >
                  Deposit
                </Tabs.Trigger>

                <Tabs.Trigger
                  key="withdraw"
                  className="flex-1 bg-adamant-app-box-lighter px-4 py-4 rounded-xl text-white/75
                             data-[state=active]:text-black data-[state=active]:bg-white/75
                             hover:bg-white/5 transition-colors font-medium tracking-wide"
                  value="withdraw"
                >
                  Withdraw
                </Tabs.Trigger>

                <SparklyTab value="staking">Staking</SparklyTab>
              </Tabs.List>

              <Tabs.Content value="deposit" className="outline-none">
                <DepositForm
                  initialAmount0={router.query.amount0 as string}
                  initialAmount1={router.query.amount1 as string}
                  initialToken={router.query.token as string}
                  initialAmount={router.query.amount as string}
                />
              </Tabs.Content>

              <Tabs.Content value="withdraw" className="outline-none">
                <WithdrawForm />
              </Tabs.Content>

              <Tabs.Content value="staking" className="outline-none">
                <ErrorBoundary
                  fallback={
                    <div className="p-6 bg-red-900/20 border border-red-500/20 rounded-xl text-white">
                      <h3 className="text-lg font-semibold mb-2">
                        Staking temporarily unavailable
                      </h3>
                      <p className="text-gray-300 mb-4">
                        There was an issue loading the staking interface. This is usually related to
                        viewing key problems.
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Refresh Page
                      </button>
                    </div>
                  }
                >
                  <StakingForm initialStakingAmount={router.query.stakingAmount as string} />
                </ErrorBoundary>
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
