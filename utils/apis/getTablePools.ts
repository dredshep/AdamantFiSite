import { LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import { TablePool } from '@/types/api/TablePool';

export type TablePoolResponse = TablePool[];

/**
 * Get pool data for the pools table
 * @returns Array of table pool data
 */
export const getTablePools = (): TablePoolResponse => {
  // Create table pools from the LIQUIDITY_PAIRS configuration
  const tablePools: TablePool[] = LIQUIDITY_PAIRS.map((pair) => {
    // Find tokens by symbol
    const token0 = TOKENS.find((token) => token.symbol === pair.token0);
    const token1 = TOKENS.find((token) => token.symbol === pair.token1);

    const name = `${pair.token0}/${pair.token1}`;

    return {
      contract_address: pair.pairContract,
      name,
      network: 'Secret Network',
      about: `Liquidity pool for ${token0?.name ?? pair.token0} and ${token1?.name ?? pair.token1}`,
    };
  });

  return tablePools;
};
