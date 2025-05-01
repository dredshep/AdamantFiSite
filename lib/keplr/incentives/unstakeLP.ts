import { SecretNetworkClient } from 'secretjs';
import { getStakingContractInfo } from '@/utils/staking/stakingRegistry';

export interface UnstakeLPParams {
  secretjs: SecretNetworkClient;
  lpToken: string;
  amount: string;
}

/**
 * Unstakes LP tokens from the incentives contract
 * @param params Object containing secretjs client, staking contract info, and amount
 * @returns Transaction result
 */
export const unstakeLP = async ({ secretjs, lpToken, amount }: UnstakeLPParams) => {
  try {
    const lpStakingContract = getStakingContractInfo(lpToken);
    const lpStakingContractAddress = lpStakingContract?.stakingAddress;
    const lpStakingContractHash = lpStakingContract?.stakingCodeHash;
    const lpTokenContractAddress = lpStakingContract?.lpTokenAddress;
    const lpTokenContractHash = lpStakingContract?.lpTokenCodeHash;

    if (typeof lpStakingContractAddress !== 'string' || lpStakingContractAddress.trim() === '') {
      throw new Error('lpStaking contract address is not configured');
    }

    if (typeof lpStakingContractHash !== 'string' || lpStakingContractHash.trim() === '') {
      throw new Error('lpStaking contract hash is not configured');
    }

    if (typeof lpTokenContractAddress !== 'string' || lpTokenContractAddress.trim() === '') {
      throw new Error('lpStaking contract hash is not configured');
    }

    if (typeof lpTokenContractHash !== 'string' || lpTokenContractHash.trim() === '') {
      throw new Error('lpStaking contract hash is not configured');
    }

    console.log(`Unstaking ${amount} LP tokens from ${lpStakingContractAddress}`);

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
        contract_address: lpStakingContractAddress,
        code_hash: lpStakingContractHash,
        msg: unstakeMsg,
        sent_funds: [],
      },
      {
        gasLimit: 500_000,
      }
    );

    console.log('Unstaking successful', unstakeTx);

    return unstakeTx;
  } catch (error) {
    console.error('Error unstaking LP tokens:', error);
    throw error;
  }
};
