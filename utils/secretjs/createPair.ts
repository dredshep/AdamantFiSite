import { AssetInfo, TokenInfo } from "@/types/ContractPool";
import { MsgCreatePair } from "@/types/api/Factory";
import { SecretNetworkClient } from "secretjs";

// TODO: Import the Factory contract information from somewhere TBD.
// const contract_address = FACTORY.address;
// const code_hash = FACTORY.code_hash;

// NOTE: Sample inputs
// const asset0: TokenInfo = {
//   token: {
//     contract_addr: "TBD",
//     token_code_hash: "TBD",
//     viewing_key: "AdamantFi",
//   },
// };
// const asset1: TokenInfo = {
//   token: {
//     contract_addr: "TBD",
//     token_code_hash: "TBD",
//     viewing_key: "AdamantFi",
//   },
// };

export async function createPair(
  secretjs: SecretNetworkClient,
  asset0: TokenInfo,
  asset1: TokenInfo,
) {
  const create_pair: MsgCreatePair = {
    create_pair: { asset_infos: [asset0, asset1] },
  };

  const tx = await secretjs.tx.compute.executeContract({
    sender: secretjs.address,
    contract_address: "secret1fjqlk09wp7yflxx7y433mkeskqdtw3yqerkcgp",
    code_hash:
      "16ea6dca596d2e5e6eef41df6dc26a1368adaa238aa93f07959841e7968c51bd",
    msg: create_pair,
  });

  console.debug(JSON.stringify(tx, null, 4));

  return tx;
}
