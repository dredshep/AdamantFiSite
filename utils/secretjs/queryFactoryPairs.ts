import { SecretNetworkClient } from "secretjs";
import { ContractInfo, Pair } from "@/types/secretswap/shared";
import { PairsResponse, QueryMsg } from "@/types/secretswap/factory";

export async function queryFactoryPairs(
  secretjs: SecretNetworkClient,
  factory_contract: ContractInfo,
  limit: number = 100,
): Promise<Pair[]> {
  const query: QueryMsg = {
    pairs: { limit },
  };

  const { pairs }: PairsResponse = await secretjs.query.compute.queryContract({
    contract_address: factory_contract.address,
    code_hash: factory_contract.code_hash,
    query,
  });

  return pairs;
}
