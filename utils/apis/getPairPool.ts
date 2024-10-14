import { PoolResponse } from "@/types/api/Pair";
import { SecretNetworkClient } from "secretjs";

// TODO: centralize SecretNetworkClient creation
const secretjs = new SecretNetworkClient({
  url: "https://rpc.ankr.com/http/scrt_cosmos",
  chainId: "secret-4",
});

export async function queryPool(
  contract_address: string,
  code_hash = "0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490",
): Promise<PoolResponse> {
  const data: PoolResponse = await secretjs.query.compute.queryContract({
    contract_address,
    code_hash,
    query: { pool: {} },
  });
  return data;
}
