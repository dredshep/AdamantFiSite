import { SecretNetworkClient } from 'secretjs';
import { ContractInfo } from '../common/types';

export interface StakeLPParams {
  secretjs: SecretNetworkClient;
  lpStakingContract: ContractInfo;
  lpTokenContract: ContractInfo;
  amount: string;
}

/**
 * Stakes LP tokens in the incentives contract
 * @param params Object containing secretjs client, contracts info, and amount
 * @returns Transaction result
 */
export const stakeLP = async ({
  secretjs,
  lpStakingContract,
  lpTokenContract,
  amount,
}: StakeLPParams) => {
  try {
    console.log(`Staking ${amount} LP tokens to ${lpStakingContract.address}`);

    const sendMsg = {
      send: {
        recipient: lpStakingContract.address,
        amount: amount,
        msg: btoa(
          JSON.stringify({
            deposit: {},
          })
        ),
      },
    };

    console.log('Staking LP tokens', sendMsg);

    const stakeTx = await secretjs.tx.compute.executeContract(
      {
        sender: secretjs.address,
        contract_address: lpTokenContract.address,
        code_hash: lpTokenContract.code_hash,
        msg: sendMsg,
        sent_funds: [],
      },
      {
        gasLimit: 200_000,
      }
    );

    console.log('Staking successful', stakeTx);

    return stakeTx;
  } catch (error) {
    console.error('Error staking LP tokens:', error);
    throw error;
  }
};
