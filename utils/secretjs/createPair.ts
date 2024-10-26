import { SecretNetworkClient } from "secretjs";
import { ContractInfo, Token } from "@/types/secretswap/shared";
import { ExecuteMsg } from "@/types/secretswap/factory";

// NOTE: Sample inputs

const token0: Token = {
  token: {
    contract_addr: "TBD",
    token_code_hash: "TBD",
    viewing_key: "AdamantFi",
  },
};
const token1: Token = {
  token: {
    contract_addr: "TBD",
    token_code_hash: "TBD",
    viewing_key: "AdamantFi",
  },
};

export async function createPair(
  secretjs: SecretNetworkClient,
  factory_contract: ContractInfo,
  token0: Token,
  token1: Token,
) {
  const create_pair: ExecuteMsg = {
    create_pair: { asset_infos: [token0, token1] },
  };

  const tx = await secretjs.tx.compute.executeContract({
    sender: secretjs.address,
    contract_address: factory_contract.address,
    code_hash: factory_contract.code_hash,
    msg: create_pair,
  });

  console.debug(JSON.stringify(tx, null, 4));

  return tx;
}
