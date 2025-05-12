import { TOKENS } from '@/config/tokens';
import { SecretString } from '@/types';
import { queryFactoryPairs } from '@/utils/apis/getFactoryPairs';
import { queryPool } from '@/utils/apis/getPairPool';
import { PairPoolData, PoolDetails, PoolQueryResult, SelectedPoolType } from './types';

export async function fetchPoolData(
  poolAddress: SecretString,
  codeHash: string | undefined,
  setSelectedPool: (pool: SelectedPoolType) => void
): Promise<PoolQueryResult> {
  const [pairData, factoryPairs] = await Promise.all([
    queryPool(poolAddress, codeHash),
    queryFactoryPairs(),
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

    // Find ConfigTokens for the tokens in the pair
    const token0Address = pair.asset_infos[0]?.token?.contract_addr;
    const token1Address = pair.asset_infos[1]?.token?.contract_addr;

    // Find the tokens in our config
    const token0 = TOKENS.find((token) => token.address === token0Address) || null;
    const token1 = TOKENS.find((token) => token.address === token1Address) || null;

    if (!token0 || !token1) {
      console.error('Token not found in configuration:', { token0Address, token1Address });
      throw new Error('Token not found in configuration');
    }

    setSelectedPool({
      address: poolAddress,
      token0,
      token1,
      pairInfo: pair,
    });
  }

  // Create a minimal poolDetails array with just the current pool
  const poolDetails: PoolDetails[] = [
    {
      contract_address: poolAddress,
      name: pair
        ? pair.liquidity_token || `Pool-${poolAddress.slice(0, 8)}`
        : `Pool-${poolAddress.slice(0, 8)}`,
    },
  ];

  return {
    pools: poolDetails,
    pairPoolData: pairData as PairPoolData,
    poolDetails: poolDetails[0],
  };
}

export function validatePoolAddress(
  poolAddress: SecretString | SecretString[] | undefined
): SecretString {
  if (typeof poolAddress !== 'string') {
    throw new Error('Invalid pool address');
  }
  return poolAddress;
}
