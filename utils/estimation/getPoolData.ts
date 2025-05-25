import { POOL_FEE, feeToDecimal } from '@/config/fees';
import { PoolData, PoolQueryResponse } from '@/types/estimation';
import { getTokenDecimals } from '@/utils/token/tokenInfo';
import Decimal from 'decimal.js';
import { SecretNetworkClient } from 'secretjs';

export const getPoolData = async (
  secretjs: SecretNetworkClient,
  poolAddress: string,
  codeHash: string
): Promise<PoolData> => {
  console.log(`🔍 Querying pool data:`, {
    poolAddress,
    codeHash,
    query: { pool: {} },
  });

  const response: PoolQueryResponse = await secretjs.query.compute.queryContract({
    contract_address: poolAddress,
    code_hash: codeHash,
    query: { pool: {} },
  });

  console.log(`📊 Pool query response:`, response);

  if (typeof response !== 'object' || response === null) {
    throw new Error('Invalid response from pool contract');
  }

  const reserves = response.assets.reduce(
    (acc: { [key: string]: { amount: Decimal; decimals: number } }, asset) => {
      const decimals = getTokenDecimals(asset.info.token.contract_addr);
      const amount = new Decimal(asset.amount);
      console.log(`💰 Processing asset:`, {
        contractAddr: asset.info.token.contract_addr,
        amount: asset.amount,
        decimals,
        isZero: amount.isZero(),
      });
      acc[asset.info.token.contract_addr] = {
        amount,
        decimals,
      };
      return acc;
    },
    {}
  );

  console.log(`🏦 Final reserves:`, reserves);

  // Check if pool has any liquidity
  const hasLiquidity = Object.values(reserves).some((reserve) => !reserve.amount.isZero());
  if (!hasLiquidity) {
    throw new Error('Pool has no liquidity - all reserves are zero');
  }

  return {
    reserves,
    fee: feeToDecimal(POOL_FEE),
  };
};
