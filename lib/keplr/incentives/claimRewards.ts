import { SecretNetworkClient } from 'secretjs';
import { ContractInfo } from '../common/types';

export interface ClaimRewardsParams {
  secretjs: SecretNetworkClient;
  lpStakingContract: ContractInfo;
  amount: string;
}

/**
 * Claims pending rewards from the incentives contract
 * @param params Object containing secretjs client and staking contract info
 * @returns Transaction result
 */
export const claimRewards = async ({ secretjs, lpStakingContract, amount }: ClaimRewardsParams) => {
  try {
    console.log(`Claiming rewards from ${lpStakingContract.address}`);

    // Create the claim rewards message
    const claimMsg = {
      redeem: { amount },
    };

    console.log('Claiming rewards', claimMsg);

    const claimTx = await secretjs.tx.compute.executeContract(
      {
        sender: secretjs.address,
        contract_address: lpStakingContract.address,
        code_hash: lpStakingContract.code_hash,
        msg: claimMsg,
        sent_funds: [],
      },
      {
        gasLimit: 500_000,
      }
    );

    console.log('Rewards claimed successfully', claimTx);

    return claimTx;
  } catch (error) {
    console.error('Error claiming rewards:', error);
    throw error;
  }
};
