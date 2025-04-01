import { SecretNetworkClient } from 'secretjs';
import { ContractInfo } from '../common/types';

export interface ClaimRewardsParams {
  secretjs: SecretNetworkClient;
  lpStakingContract: ContractInfo;
}

/**
 * Claims pending rewards from the incentives contract
 * @param params Object containing secretjs client and staking contract info
 * @returns Transaction result
 */
export const claimRewards = async ({ secretjs, lpStakingContract }: ClaimRewardsParams) => {
  try {
    console.log(`Claiming rewards from ${lpStakingContract.address}`);

    // Create the claim rewards message
    const claimMsg = {
      claim: {},
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
        gasLimit: 200_000,
      }
    );

    console.log('Rewards claimed successfully', claimTx);

    return {
      transactionHash: claimTx.transactionHash,
      height: claimTx.height,
      gasUsed: claimTx.gasUsed,
      gasWanted: claimTx.gasWanted,
    };
  } catch (error) {
    console.error('Error claiming rewards:', error);
    throw error;
  }
};
