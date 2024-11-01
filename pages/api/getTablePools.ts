import { SecretString, TablePool } from '@/types';
import { NextApiRequest, NextApiResponse } from 'next';
// import { PriceData } from "./getPrices";
import { queryFactoryPairs } from '@/utils/apis/getFactoryPairs';
import { getApiTokenSymbol, getTokenFromAddress } from '@/utils/apis/getSwappableTokens';
// import { Pair } from "@/types/api/Factory";

const getTablePools = async (
  _req: NextApiRequest,
  res: NextApiResponse<TablePool[] | { error: string }>
) => {
  try {
    // const [pairs, pricesData, swappableTokens] = await Promise.all([
    //   queryFactoryPairs(),
    //   getPrices(),
    //   getSwappableTokens(),
    // ]);
    const pairs = await queryFactoryPairs();

    const tablePools: TablePool[] = pairs.map((pair) => {
      const tokenSymbols = pair.asset_infos?.map((token) => {
        const address = token.token.contract_addr as SecretString;
        const apiToken = getTokenFromAddress(address);
        const symbol = apiToken ? getApiTokenSymbol(apiToken) : address.slice(-5);
        return symbol;
      });
      const poolName = tokenSymbols.join('-');
      // const tvl = calculateTVL(pair, pricesData);
      // const price = calculatePoolPrice(pair, pricesData);
      // const change = calculatePoolChange(pair, pricesData);

      return {
        contract_address: pair.contract_addr,
        name: poolName,
        network: 'Secret Network',
        // price: price.toFixed(2),
        // change: change.toFixed(2) + "%",
        // total_value_locked: tvl.toFixed(2),
        about: `Liquidity pool for ${poolName}`,
      } as TablePool;
    });

    res.status(200).json(tablePools);
  } catch (error) {
    console.error('Error fetching pool data:', error);
    res.status(500).json({ error: 'Failed to fetch pool data' });
  }
};

// const getTokenSymbol = (
//   contractAddr: string,
//   swappableTokens: ApiToken[]
// ): string => {
//   const token = swappableTokens.find((t) => t.address === contractAddr);
//   return token ? token.symbol : contractAddr.slice(-5);
// };

// const calculateTVL = (pair: Pair, pricesData: PriceData): number => {
//   // This is a placeholder. You'll need to implement the actual TVL calculation
//   // based on the asset amounts and their respective prices.
//   return 0;
// };

// const calculatePoolPrice = (pair: Pair, pricesData: PriceData): number => {
//   // This is a placeholder. You'll need to implement the actual pool price calculation.
//   return 0;
// };

// const calculatePoolChange = (pair: Pair, pricesData: PriceData): number => {
//   // This is a placeholder. You'll need to implement the actual change calculation.
//   return 0;
// };

export default getTablePools;
