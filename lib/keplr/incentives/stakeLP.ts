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

    // Step 1: Increase allowance for the LP token contract
    const increaseAllowanceMsg = {
      increase_allowance: {
        spender: lpStakingContract.address,
        amount: amount,
      },
    };

    console.log('Increasing allowance for LP token contract', increaseAllowanceMsg);

    const increaseAllowanceTx = await secretjs.tx.compute.executeContract(
      {
        sender: secretjs.address,
        contract_address: lpTokenContract.address,
        code_hash: lpTokenContract.code_hash,
        msg: increaseAllowanceMsg,
        sent_funds: [],
      },
      {
        gasLimit: 100_000,
      }
    );

    console.log('Allowance increased successfully', increaseAllowanceTx);

    // Step 2: Stake the LP tokens
    const stakeMsg = {
      deposit: {
        amount: amount,
      },
    };

    console.log('Staking LP tokens', stakeMsg);

    const stakeTx = await secretjs.tx.compute.executeContract(
      {
        sender: secretjs.address,
        contract_address: lpStakingContract.address,
        code_hash: lpStakingContract.code_hash,
        msg: stakeMsg,
        sent_funds: [],
      },
      {
        gasLimit: 200_000,
      }
    );

    console.log('Staking successful', stakeTx);

    return {
      transactionHash: stakeTx.transactionHash,
      height: stakeTx.height,
      gasUsed: stakeTx.gasUsed,
      gasWanted: stakeTx.gasWanted,
    };
  } catch (error) {
    console.error('Error staking LP tokens:', error);
    throw error;
  }
};
