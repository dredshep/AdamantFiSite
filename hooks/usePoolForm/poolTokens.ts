import { SecretString } from '@/types';
import { ConfigToken } from '../../config/tokens';
import { PairInfo, SelectedPoolType } from './types';

export function setupPoolTokens(
  pair: PairInfo,
  tokens: ConfigToken[],
  poolAddress: string,
  setSelectedPool: (pool: SelectedPoolType) => void
): void {
  const token0Address = pair.asset_infos[0]?.token?.contract_addr;
  const token1Address = pair.asset_infos[1]?.token?.contract_addr;

  if (
    typeof token0Address === 'string' &&
    typeof token1Address === 'string' &&
    token0Address.length > 0 &&
    token1Address.length > 0
  ) {
    const token0 = tokens.find((t) => t.address === token0Address);
    const token1 = tokens.find((t) => t.address === token1Address);

    if (token0 && token1) {
      if (!poolAddress.startsWith('secret1')) {
        console.error('Invalid pool address format:', poolAddress);
        return;
      }

      setSelectedPool({
        address: poolAddress as SecretString,
        token0,
        token1,
        pairInfo: pair,
      });
    }
  }
}
