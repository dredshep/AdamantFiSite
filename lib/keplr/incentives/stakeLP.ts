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
    console.log('🎯 STAKE LP: Starting stakeLP function with params:', {
      lpToken,
      amount,
      hasSecretjs: !!secretjs,
      secretjsAddress: secretjs?.address,
    });

    const lpStakingContract = getStakingContractInfo(lpToken);
    console.log('🎯 STAKE LP: Got staking contract info:', lpStakingContract);

    const lpStakingContractAddress = lpStakingContract?.stakingAddress;
    const lpStakingContractHash = lpStakingContract?.stakingCodeHash;
    const lpTokenContractAddress = lpStakingContract?.lpTokenAddress;
    const lpTokenContractHash = lpStakingContract?.lpTokenCodeHash;

    console.log('🎯 STAKE LP: Contract addresses:', {
      lpStakingContractAddress,
      lpStakingContractHash,
      lpTokenContractAddress,
      lpTokenContractHash,
    });

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

    console.log(`🎯 STAKE LP: Staking ${amount} LP tokens to ${lpStakingContractAddress}`);

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

    console.log('🎯 STAKE LP: Prepared send message:', sendMsg);

    console.log('🎯 STAKE LP: About to execute contract with params:', {
      sender: secretjs.address,
      contract_address: lpTokenContractAddress,
      code_hash: lpTokenContractHash,
      msg: sendMsg,
      sent_funds: [],
      gasLimit: 500_000,
    });

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

    console.log('🎯 STAKE LP: Transaction completed with result:', stakeTx);

    // Check if the transaction was successful
    if (stakeTx.code !== TxResultCode.Success) {
      console.error(
        '🎯 STAKE LP: Transaction failed with code:',
        stakeTx.code,
        'rawLog:',
        stakeTx.rawLog
      );
      throw new Error(`Staking failed: ${stakeTx.rawLog}`);
    }

    console.log('🎯 STAKE LP: Staking successful!');
    return stakeTx;
  } catch (error) {
    console.error('🎯 STAKE LP: Error staking LP tokens:', error);
    console.error('🎯 STAKE LP: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};
