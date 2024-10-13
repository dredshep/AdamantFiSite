import { SecretNetworkClient } from "secretjs";

// TODO: centralize SecretNetworkClient creation
const secretjs = new SecretNetworkClient({
  url: "https://rpc.ankr.com/http/scrt_cosmos",
  chainId: "secret-4",
});

export async function queryPool(contract_address: string, code_hash?: string) {
  const data = await secretjs.query.compute.queryContract({
    contract_address,
    code_hash,
    query: { pool: {} },
  });
  return data;
}
