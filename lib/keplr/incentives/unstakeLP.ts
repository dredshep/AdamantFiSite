import { SecretNetworkClient } from 'secretjs';
import { ContractInfo } from '../common/types';

export interface UnstakeLPParams {
  secretjs: SecretNetworkClient;
  lpStakingContract: ContractInfo;
  amount: string;
}

/**
 * Unstakes LP tokens from the incentives contract
 * @param params Object containing secretjs client, staking contract info, and amount
 * @returns Transaction result
 */
export const unstakeLP = async ({ secretjs, lpStakingContract, amount }: UnstakeLPParams) => {
  try {
    console.log(`Unstaking ${amount} LP tokens from ${lpStakingContract.address}`);

    // Create the unstake message
    const unstakeMsg = {
      withdraw: {
        amount: amount,
      },
    };

    console.log('Unstaking LP tokens', unstakeMsg);

    const unstakeTx = await secretjs.tx.compute.executeContract(
      {
        sender: secretjs.address,
        contract_address: lpStakingContract.address,
        code_hash: lpStakingContract.code_hash,
        msg: unstakeMsg,
        sent_funds: [],
      },
      {
        gasLimit: 200_000,
      }
    );

    console.log('Unstaking successful', unstakeTx);

    return {
      transactionHash: unstakeTx.transactionHash,
      height: unstakeTx.height,
      gasUsed: unstakeTx.gasUsed,
      gasWanted: unstakeTx.gasWanted,
    };
  } catch (error) {
    console.error('Error unstaking LP tokens:', error);
    throw error;
  }
};
