import { PoolResponse, QueryMsg } from '@/types/secretswap/pair';
import { SecretNetworkClient } from 'secretjs';
import isNotNullish from '../../isNotNullish';

export async function queryPool(
  secretjs: SecretNetworkClient,
  contract_address: string,
  code_hash?: string
): Promise<PoolResponse> {
  const query: QueryMsg = { pool: {} };

  const data: PoolResponse = await secretjs.query.compute.queryContract<
    {
      pool: object;
    },
    PoolResponse
  >(
    isNotNullish(code_hash)
      ? {
          contract_address,
          code_hash,
          query,
        }
      : { contract_address, query }
  );

  return data;
}
