import { SecretNetworkClient } from "secretjs";
import { ContractInfo } from "@/types/secretswap/shared";
import { PoolResponse, QueryMsg } from "@/types/secretswap/pair";

export async function queryPool(
  secretjs: SecretNetworkClient,
  contract_address: string,
  code_hash?: string,
): Promise<PoolResponse> {
  const query: QueryMsg = { pool: {} };

  const data: PoolResponse = await secretjs.query.compute.queryContract({
    contract_address,
    code_hash,
    query,
  });

  return data;
}
