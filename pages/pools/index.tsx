import AppLayout from '@/components/app/Global/AppLayout';
import {
  FinancialDataRow,
  FinancialTableSearchBar,
  TableHeaders,
} from '@/components/app/Shared/Tables/FinancialTable';
import TokenDisplay from '@/components/app/Shared/Tables/TokenDisplay';
import { SecretString, TablePool } from '@/types';
import { getTablePools } from '@/utils/apis/getTablePools';
import { validatePools } from '@/utils/apis/isPoolConfigured';
import * as Tabs from '@radix-ui/react-tabs';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ValidatedPool extends TablePool {
  isValid: boolean;
  validationReason: string | undefined;
}

export default function PoolsPage() {
  const [pools, setPools] = useState<ValidatedPool[]>([]);
  const [loading, setLoading] = useState(true);
  // const [showAllPools, setShowAllPools] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stablecoins, setStablecoins] = useState(false);
  const [native, setNative] = useState(false);
  const [incentivized, setIncentivized] = useState(false);

  useEffect(() => {
    const fetchAndValidatePools = async () => {
      try {
        const poolsData = await getTablePools();
        if ('error' in poolsData) {
          throw new Error(poolsData.error);
        }
        const validationResults = await validatePools(poolsData);

        const validatedPools: ValidatedPool[] = poolsData.map((pool, index) => ({
          ...pool,
          isValid: validationResults[index]?.isValid ?? false,
          validationReason: validationResults[index]?.reason,
        }));

        setPools(validatedPools);
      } catch (error) {
        console.error('Error fetching and validating pools:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchAndValidatePools();
  }, []);

  const filteredPools = pools.filter((pool) => {
    const matchesSearch =
      pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.contract_address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-screen">Loading...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto mt-12 px-4">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row flex-wrap justify-between items-center gap-4">
            <Tabs.Root defaultValue="all" className="mb-4">
              <Tabs.List className="flex text-black bg-gray-800 rounded-lg max-w-fit items-center">
                <Tabs.Trigger
                  value="all"
                  className="flex items-center justify-center h-[35px] px-6 text-lg pt-0.5 rounded-lg data-[state=active]:bg-white data-[state=inactive]:bg-gray-800 data-[state=inactive]:text-white data-[state=active]:text-adamant-primary data-[state=active]:border-b-2 data-[state=active]:border-adamant-primary"
                >
                  All Pools
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="your"
                  className="flex items-center justify-center h-[35px] px-6 text-lg pt-0.5 rounded-lg data-[state=active]:bg-white data-[state=inactive]:bg-gray-800 data-[state=inactive]:text-white data-[state=active]:text-adamant-primary data-[state=active]:border-b-2 data-[state=active]:border-adamant-primary"
                >
                  Your Pools
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>

            <div className="flex flex-col md:flex-row items-center gap-4 select-none">
              <label className="flex items-center">
                <div
                  className={`w-6 h-6 rounded bg-${
                    stablecoins ? 'blue-500' : 'gray-700'
                  } cursor-pointer`}
                  onClick={() => setStablecoins(!stablecoins)}
                />
                <span className="ml-2 text-white">Stablecoins</span>
              </label>
              <label className="flex items-center">
                <div
                  className={`w-6 h-6 rounded bg-${
                    native ? 'blue-500' : 'gray-700'
                  } cursor-pointer`}
                  onClick={() => setNative(!native)}
                />
                <span className="ml-2 text-white">Native</span>
              </label>
              <label className="flex items-center">
                <div
                  className={`w-6 h-6 rounded bg-${
                    incentivized ? 'blue-500' : 'gray-700'
                  } cursor-pointer`}
                  onClick={() => setIncentivized(!incentivized)}
                />
                <span className="ml-2 text-white">Incentivized</span>
              </label>

              <FinancialTableSearchBar placeholder="Search" onSearch={setSearchTerm} />
            </div>
          </div>
          {/* {showAllPools === true && (*/}
          {/* <div className="text-yellow-500 text-sm">
            Warning: Some pools shown may not be properly configured and could cause errors when
            interacting with them.
          </div> */}
        </div>
        {/* radix tabs All Pools or Your Pools */}

        <TableHeaders
          headers={[
            { title: 'Pool', minWidth: '240px' },
            { title: 'TVL' },
            { title: 'Rewards' },
            { title: '' },
          ]}
        />
        <div className="rounded-b-[10px] overflow-hidden">
          {filteredPools.map((pool, index) => (
            <Link
              key={index}
              className="flex items-center bg-adamant-box-dark hover:brightness-125 select-none py-4 px-6"
              href={`/app/pool/${pool.contract_address}`}
            >
              <FinancialDataRow
                cells={[
                  {
                    content: (
                      <TokenDisplay
                        seed={pool.contract_address as SecretString}
                        name={pool.name}
                        // network={pool.network}
                      />
                    ),
                    minWidth: '240px',
                  },
                  {
                    content: <div>TVL</div>,
                  },
                  {
                    content: <div>Rewards</div>,
                  },
                  {
                    content: <div>Provide Liquidity</div>,
                  },
                  // {
                  //   content: (
                  //     <div
                  //       className={`text-sm ${
                  //         pool.isValid === true ? 'text-green-500' : 'text-red-500'
                  //       }`}
                  //     >
                  //       {pool.isValid === true ? 'Valid' : 'Invalid'}
                  //       {pool.isValid === false && typeof pool.validationReason === 'string' && (
                  //         <span className="block text-xs text-gray-400">
                  //           {pool.validationReason}
                  //         </span>
                  //       )}
                  //     </div>
                  //   ),
                  // },
                  // Add other cells as needed
                ]}
              />
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
