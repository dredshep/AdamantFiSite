import { getStakingContractInfo } from '@/utils/staking/stakingRegistry';
import { SecretNetworkClient, TxResultCode } from 'secretjs';

export interface StakeLPParams {
  secretjs: SecretNetworkClient;
  lpToken: string;
  amount: string;
}

/**
 * Stakes LP tokens in the incentives contract
 * @param params Object containing secretjs client, contracts info, and amount
 * @returns Transaction result
 */
export const stakeLP = async ({ secretjs, lpToken, amount }: StakeLPParams) => {
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

    console.log(`Staking ${amount} LP tokens to ${lpStakingContractAddress}`);

    const sendMsg = {
      send: {
        recipient: lpStakingContractAddress,
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
        contract_address: lpTokenContractAddress,
        code_hash: lpTokenContractHash,
        msg: sendMsg,
        sent_funds: [],
      },
      {
        gasLimit: 500_000,
      }
    );

    console.log('Staking transaction result:', stakeTx);

    // Check if the transaction was successful
    if (stakeTx.code !== TxResultCode.Success) {
      throw new Error(`Staking failed: ${stakeTx.rawLog}`);
    }

    console.log('Staking successful');
    return stakeTx;
  } catch (error) {
    console.error('Error staking LP tokens:', error);
    throw error;
  }
};
