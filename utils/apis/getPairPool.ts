import { getSecretClient } from '@/hooks/useSecretNetwork';
import { SecretString } from '@/types';
import { PoolResponse } from '@/types/api/Pair';

export async function queryPool(
  contract_address: SecretString,
  code_hash?: string
): Promise<PoolResponse> {
  const queryWithHash = {
    contract_address,
    code_hash,
    query: { pool: {} },
  };
  const queryWithoutHash = {
    contract_address,
    query: { pool: {} },
  };
  const secretjs = getSecretClient();
  const data: PoolResponse = await secretjs.query.compute.queryContract(
    code_hash != null ? queryWithHash : queryWithoutHash
  );
  return data;
}
