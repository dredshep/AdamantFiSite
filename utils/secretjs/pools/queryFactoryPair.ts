import { SecretNetworkClient } from "secretjs";
import { AssetInfo, ContractInfo, Pair } from "@/types/secretswap/shared";
import { PairResponse, QueryMsg } from "@/types/secretswap/factory";

export async function queryFactoryPair(
  secretjs: SecretNetworkClient,
  factory_contract: ContractInfo,
  asset0: AssetInfo,
  asset1: AssetInfo
): Promise<Pair> {
  const query: QueryMsg = {
    pair: { asset_infos: [asset0, asset1] },
  };

  const pair: PairResponse = await secretjs.query.compute.queryContract({
    contract_address: factory_contract.address,
    code_hash: factory_contract.code_hash,
    query,
  });

  return pair;
}
