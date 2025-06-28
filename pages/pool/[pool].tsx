import { Breadcrumb } from '@/components/app/Breadcrumb';
import AppLayout from '@/components/app/Global/AppLayout';
import DepositForm from '@/components/app/Pages/Pool/DepositForm';
import StakingForm from '@/components/app/Pages/Pool/StakingForm';
import WithdrawForm from '@/components/app/Pages/Pool/WithdrawForm';
import SparklyTab from '@/components/app/Pages/Pools/SparklyTab';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { usePoolsAndTokens } from '@/hooks/usePoolsAndTokens';
import { usePoolStore } from '@/store/forms/poolStore';
import { SecretString } from '@/types';
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

    const selectedPool = pools.find((p) => {
      const contractAddr = p.pair.contract_addr;
      return typeof contractAddr === 'string' && contractAddr === poolAddress;
    });

    if (!selectedPool) {
      console.error('Pool not found in available pools:', {
        poolAddress,
        availablePools: pools.map((p) => p.pair.contract_addr),
      });
      return;
    }

    const liquidityToken = selectedPool.pair.liquidity_token;
    if (typeof liquidityToken !== 'string' || !liquidityToken.startsWith('secret1')) {
      console.error('Invalid liquidity token format:', liquidityToken);
      return;
    }

    setSelectedPool({
      address: poolAddress as SecretString,
      pairInfo: {
        ...selectedPool.pair,
        liquidity_token: liquidityToken,
      },
      token0: selectedPool.token0,
      token1: selectedPool.token1,
    });
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
            <Tabs.Root className="flex flex-col" defaultValue="deposit">
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
                <DepositForm />
              </Tabs.Content>

              <Tabs.Content value="withdraw" className="outline-none">
                <WithdrawForm />
              </Tabs.Content>

              <Tabs.Content value="staking" className="outline-none">
                <StakingForm />
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
