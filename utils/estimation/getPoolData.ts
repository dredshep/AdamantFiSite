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
  const response: PoolQueryResponse = await secretjs.query.compute.queryContract({
    contract_address: poolAddress,
    code_hash: codeHash,
    query: { pool: {} },
  });

  if (typeof response !== 'object' || response === null) {
    throw new Error('Invalid response from pool contract');
  }

  const reserves = response.assets.reduce(
    (acc: { [key: string]: { amount: Decimal; decimals: number } }, asset) => {
      const decimals = getTokenDecimals(asset.info.token.contract_addr);
      acc[asset.info.token.contract_addr] = {
        amount: new Decimal(asset.amount),
        decimals,
      };
      return acc;
    },
    {}
  );

  return {
    reserves,
    fee: feeToDecimal(POOL_FEE),
  };
};
