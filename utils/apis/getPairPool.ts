import { SecretString } from '@/types';
import { PoolResponse } from '@/types/api/Pair';
import { getSecretNetworkEnvVars } from '@/utils/env';
import { SecretNetworkClient } from 'secretjs';

// Use environment variables for client configuration
const envVars = getSecretNetworkEnvVars();
const secretjs = new SecretNetworkClient({
  url: envVars.RPC_URL,
  chainId: envVars.CHAIN_ID,
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
