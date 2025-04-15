import { SecretString } from '@/types';
import { queryFactoryPairs } from '@/utils/apis/getFactoryPairs';
import { queryPool } from '@/utils/apis/getPairPool';
import { getApiToken } from '@/utils/apis/getSwappableTokens';
import { getTablePools } from '@/utils/apis/getTablePools';
import { setupPoolTokens } from './poolTokens';
import { PairInfo, PairPoolData, PoolDetails, PoolQueryResult, SelectedPoolType } from './types';

export async function fetchPoolData(
  poolAddress: string,
  setSelectedPool: (pool: SelectedPoolType) => void
): Promise<PoolQueryResult> {
  const [poolsData, pairData, factoryPairs, tokens] = await Promise.all([
    getTablePools(),
    queryPool(poolAddress),
    queryFactoryPairs(),
    getApiToken(),
  ]);

  if (pairData === undefined || typeof pairData !== 'object') {
    throw new Error('Invalid pair data received');
  }

  const pair = factoryPairs.find((p) => p.contract_addr === poolAddress);
  if (pair) {
    const isValidPair = pair.asset_infos.every((info) =>
      info.token?.contract_addr?.startsWith('secret1')
    );

    if (!isValidPair) {
      console.error('Invalid token addresses in pair:', pair);
      throw new Error('Invalid token addresses in pair');
    }

    const pairInfo = {
      ...pair,
      asset_infos: pair.asset_infos.map((info) => ({
        token: {
          ...info.token,
          contract_addr: info.token.contract_addr as SecretString,
        },
      })),
    } satisfies PairInfo;

    setupPoolTokens(pairInfo, tokens, poolAddress, setSelectedPool);
  }

  if ('error' in poolsData) {
    throw new Error(poolsData.error);
  }

  const poolDetails: PoolDetails[] = poolsData.map((pool) => ({
    ...pool,
    contract_address: pool.contract_address as SecretString,
  }));

  return {
    pools: poolDetails,
    pairPoolData: pairData as PairPoolData,
    poolDetails: poolDetails.find((p) => p.contract_address === poolAddress),
  };
}

export function validatePoolAddress(poolAddress: string | string[] | undefined): string {
  if (typeof poolAddress !== 'string') {
    throw new Error('Invalid pool address');
  }
  return poolAddress;
}
