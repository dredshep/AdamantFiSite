import { SecretNetworkClient } from "secretjs";
import { Asset, ContractInfo } from "@/types/secretswap/shared";
import { ExecuteMsg } from "@/types/secretswap/pair";

// NOTE: Sample inputs

const asset0: Asset = {
  info: {
    token: {
      contract_addr: "TBD",
      token_code_hash: "TBD",
      viewing_key: "AdamantFi",
    },
  },
  amount: "1000000",
};
const asset1: Asset = {
  info: {
    token: {
      contract_addr: "TBD",
      token_code_hash: "TBD",
      viewing_key: "AdamantFi",
    },
  },
  amount: "1000000",
};

export async function provideLiquidity(
  secretjs: SecretNetworkClient,
  pair_contract: ContractInfo,
  asset0: Asset,
  asset1: Asset,
  slippage_tolerance?: string,
) {
  const provide_liquidity: ExecuteMsg = {
    provide_liquidity: {
      assets: [asset0, asset1],
      slippage_tolerance,
    },
  };

  const tx = await secretjs.tx.compute.executeContract({
    sender: secretjs.address,
    contract_address: pair_contract.address,
    code_hash: pair_contract.code_hash,
    msg: provide_liquidity,
  });

  console.debug(JSON.stringify(tx, null, 4));

  return tx;
}
