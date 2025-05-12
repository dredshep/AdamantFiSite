import { SecretString } from '@/types';
import { PoolResponse } from '@/types/api/Pair';
import { SecretNetworkClient } from 'secretjs';

// TODO: have a single client somewhere to import instead.
const secretjs = new SecretNetworkClient({
  url: 'https://rpc.ankr.com/http/scrt_cosmos',
  chainId: 'secret-4',
});

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
  const data: PoolResponse = await secretjs.query.compute.queryContract(
    code_hash != null ? queryWithHash : queryWithoutHash
  );
  return data;
}
