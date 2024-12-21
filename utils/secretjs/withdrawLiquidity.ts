import { SecretNetworkClient } from 'secretjs';
import { ContractInfo } from '@/types/secretswap/shared';
import { Cw20HookMsg } from '@/types/secretswap/pair';

// Withdrawing liquidity is done by sending LP tokens to the Pair contract with a callback message.

export async function withdrawLiquidity(
  secretjs: SecretNetworkClient,
  lp_token_contract: ContractInfo,
  pair_contract: ContractInfo,
  amount: string
) {
  const withdraw_liquidity: Cw20HookMsg = {
    withdraw_liquidity: {},
  };

  const tx = await secretjs.tx.snip20.send(
    {
      sender: secretjs.address,
      contract_address: lp_token_contract.address,
      code_hash: lp_token_contract.code_hash,
      msg: {
        send: {
          recipient: pair_contract.address,
          amount,
          msg: btoa(JSON.stringify(withdraw_liquidity)),
        },
      },
    },
    {
      gasLimit: 400_000,
    }
  );

  console.debug(JSON.stringify(tx, null, 4));

  return tx;
}
