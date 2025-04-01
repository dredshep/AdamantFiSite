import { ExecuteMsg } from '@/types/secretswap/pair';
import { Asset, AssetInfo, ContractInfo, Token } from '@/types/secretswap/shared';
import { MsgExecuteContract, SecretNetworkClient } from 'secretjs';
import isNotNullish from '../../isNotNullish';

// NOTE: Sample inputs

// const asset0: Asset = {
//   info: {
//     token: {
//       contract_addr: "TBD",
//       token_code_hash: "TBD",
//       viewing_key: "AdamantFi",
//     },
//   },
//   amount: "1000000",
// };
// const asset1: Asset = {
//   info: {
//     token: {
//       contract_addr: "TBD",
//       token_code_hash: "TBD",
//       viewing_key: "AdamantFi",
//     },
//   },
//   amount: "1000000",
// };

export async function provideLiquidity(
  secretjs: SecretNetworkClient,
  pair_contract: ContractInfo,
  asset0: Asset,
  asset1: Asset,
  slippage_tolerance?: string
) {
  const messages = [];

  // Increase Allowance

  // FIXME: convert asset amount (i.e. "0.01") into token amount (i.e. "10_000")
  if (isToken(asset0.info)) {
    const asset0_allowance = new MsgExecuteContract({
      sender: secretjs.address,
      contract_address: asset0.info.token.contract_addr,
      code_hash: asset0.info.token.token_code_hash,
      msg: {
        increase_allowance: {
          spender: pair_contract.address,
          amount: asset0.amount,
        },
      },
    });
    messages.push(asset0_allowance);
  }

  if (isToken(asset1.info)) {
    const asset1_allowance = new MsgExecuteContract({
      sender: secretjs.address,
      contract_address: asset1.info.token.contract_addr,
      code_hash: asset1.info.token.token_code_hash,
      msg: {
        increase_allowance: {
          spender: pair_contract.address,
          amount: asset1.amount,
        },
      },
    });
    messages.push(asset1_allowance);
  }

  const provide_liquidity_msg: ExecuteMsg = isNotNullish(slippage_tolerance)
    ? {
        provide_liquidity: {
          assets: [asset0, asset1],
          slippage_tolerance,
        },
      }
    : {
        provide_liquidity: {
          assets: [asset0, asset1],
        },
      };

  const provide_liquidity = new MsgExecuteContract({
    sender: secretjs.address,
    contract_address: pair_contract.address,
    code_hash: pair_contract.code_hash,
    msg: provide_liquidity_msg,
  });
  messages.push(provide_liquidity);

  console.debug(JSON.stringify(messages, null, 4));

  const tx = await secretjs.tx.broadcast(messages, {
    gasLimit: 1_000_000,
    gasPriceInFeeDenom: 0.1,
    feeDenom: 'uscrt',
    waitForCommit: true,
    broadcastTimeoutMs: 60_000,
  });

  console.debug(JSON.stringify(tx, null, 4));

  return tx;
}

// Type guard to check if asset0.info is of type Token
function isToken(assetInfo: AssetInfo): assetInfo is Token {
  return (assetInfo as Token).token !== undefined;
}
