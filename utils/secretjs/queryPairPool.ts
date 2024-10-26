import { SecretNetworkClient } from "secretjs";
import { ContractInfo } from "@/types/secretswap/shared";
import { PoolResponse, QueryMsg } from "@/types/secretswap/pair";

export async function queryPool(
  secretjs: SecretNetworkClient,
  pair_contract: ContractInfo,
): Promise<PoolResponse> {
  const query: QueryMsg = { pool: {} };

  const data: PoolResponse = await secretjs.query.compute.queryContract({
    contract_address: pair_contract.address,
    code_hash: pair_contract.code_hash,
    query,
  });

  return data;
}
