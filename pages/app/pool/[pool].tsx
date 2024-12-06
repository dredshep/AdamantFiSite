import { Breadcrumb } from '@/components/app/Breadcrumb';
import AppLayout from '@/components/app/Global/AppLayout';
import DepositForm from '@/components/app/Pages/Pool/DepositForm';
import WithdrawForm from '@/components/app/Pages/Pool/WithdrawForm';
import SwapForm from '@/components/app/Pages/Swap/SwapForm/SwapForm';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { usePoolForm } from '@/hooks/usePoolForm';
import { usePoolsAndTokens } from '@/hooks/usePoolsAndTokens';
import { usePoolStore } from '@/store/forms/poolStore';
import { SecretString } from '@/types';
import { getApiTokenSymbol } from '@/utils/apis/getSwappableTokens';
import * as Tabs from '@radix-ui/react-tabs';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type TopBoxesProps = {
  poolAddress: string;
};

function TopBoxes({ poolAddress }: TopBoxesProps) {
  const { pairPoolData } = usePoolForm(poolAddress);
  if (!pairPoolData) return null;
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Chart */}
      <div className="bg-adamant-app-box p-4 rounded-xl">
        <h2 className="text-xl font-bold mb-4">Chart</h2>
        {/* Implement chart component */}
      </div>

      {/* Statistics Box */}
      <div className="bg-adamant-app-box p-4 rounded-xl">
        <h2 className="text-xl font-bold mb-4">Statistics</h2>
        <table className="w-full">
          <tbody>
            <tr>
              <td>Total Share</td>
              <td>{pairPoolData?.total_share}</td>
            </tr>
            {pairPoolData?.assets.map((asset, index) => (
              <tr key={index}>
                <td>Asset {index + 1}</td>
                <td>{asset.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* My Positions */}
      <div className="bg-adamant-app-box p-4 rounded-xl">
        <h2 className="text-xl font-bold mb-4">My Positions</h2>
        {/* Implement positions component */}
      </div>

      {/* Unclaimed Rewards */}
      <div className="bg-adamant-app-box p-4 rounded-xl">
        <h2 className="text-xl font-bold mb-4">Unclaimed Rewards</h2>
        {/* Implement unclaimed rewards component */}
      </div>
    </div>
  );
}

export default function PoolPage() {
  const router = useRouter();
  const [pageError, setPageError] = useState<Error | null>(null);
  const { pool } = router.query;
  const { pools, loading, error } = usePoolsAndTokens();
  const { setSelectedPool } = usePoolStore();

  useEffect(() => {
    if (typeof pool === 'string' && pools.length > 0) {
      const selectedPool = pools.find((p) => p.pair.contract_addr === pool);
      if (selectedPool) {
        setSelectedPool({
          address: pool as SecretString,
          pairInfo: selectedPool.pair,
          token0: selectedPool.token0,
          token1: selectedPool.token1,
        });
      }
    }
  }, [pool, pools, setSelectedPool]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
          <LoadingSpinner size={40} />
          <div className="text-lg font-medium text-gray-200">
            {loading ? 'Loading pools...' : 'Error loading pools'}
          </div>
        </div>
      </AppLayout>
    );
  }
  const currentPool = pools.find((p) => p.pair.contract_addr === pool);
  if (!currentPool) {
    setPageError(new Error('Pool not found'));
    return null;
  }

  if (error || pageError) {
    return (
      <AppLayout>
        <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
          <div className="bg-red-500/10 p-6 rounded-xl flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <div className="text-lg font-medium text-red-500">
              {error !== null ? error.message : pageError?.message}
            </div>
            <Link
              href="/app/pools"
              className="mt-2 bg-white text-black px-6 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Back to Pools
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }
  const symbolA = getApiTokenSymbol(currentPool.token0);
  const symbolB = getApiTokenSymbol(currentPool.token1);

  if (!Array.isArray(pools) || pools.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col gap-2 w-full items-center pt-10">
          <div className="text-lg font-semibold">No pools found</div>
          <Link
            href="/app/pools"
            className="text-black bg-white p-4 py-2 rounded-xl text-xl font-bold"
          >
            Back to Pools
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto mt-12 flex flex-col gap-4">
        <Breadcrumb linkPath="/app/pools" linkText="Pools" currentText={`${symbolA}-${symbolB}`} />
        <TopBoxes poolAddress={pool as string} />
        <div className="flex gap-4">
          {/* Swap Form */}
          <div className="mt-4 bg-adamant-app-box p-4 rounded-xl flex-1">
            <h2 className="text-xl font-bold mb-4">Swap</h2>
            <SwapForm />
          </div>

          {/* Deposit/Withdraw Forms with Tabs */}
          <div className="mt-4 bg-adamant-app-box p-4 rounded-xl flex-1">
            <Tabs.Root className="flex flex-col" defaultValue="deposit">
              <Tabs.List className="flex gap-2 mb-4" aria-label="Manage your liquidity">
                <Tabs.Trigger
                  className="flex-1 bg-adamant-app-box-lighter px-4 py-2 rounded-xl text-white/50 
                           data-[state=active]:text-white data-[state=active]:bg-white/10 
                           hover:bg-white/5 transition-colors"
                  value="deposit"
                >
                  Deposit
                </Tabs.Trigger>
                <Tabs.Trigger
                  className="flex-1 bg-adamant-app-box-lighter px-4 py-2 rounded-xl text-white/50 
                           data-[state=active]:text-white data-[state=active]:bg-white/10 
                           hover:bg-white/5 transition-colors"
                  value="withdraw"
                >
                  Withdraw
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="deposit" className="outline-none">
                <DepositForm />
              </Tabs.Content>

              <Tabs.Content value="withdraw" className="outline-none">
                <WithdrawForm />
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </div>

        {/* About Text */}
        {/* <div className="mt-4 bg-adamant-app-box p-4 rounded-xl">
          <h2 className="text-xl font-bold mb-4">About {symbolA}-{symbolB}</h2>
          <div>{currentPool.pair.}</div>
        </div> */}
      </div>
    </AppLayout>
  );
}
