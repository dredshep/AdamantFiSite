import { SecretString } from '@/types';
import { getStakingContractInfoForPool } from '@/utils/staking/stakingRegistry';
import { SecretNetworkClient, TxResultCode } from 'secretjs';

export interface SetStakingKeyParams {
  secretjs: SecretNetworkClient;
  poolAddress: SecretString;
  viewingKey: string;
}

/**
 * Sets the viewing key on the staking contract to match the LP token's viewing key.
 * @param params Object containing secretjs client, pool address, and the viewing key to set.
 * @returns Transaction result
 */
export const setStakingKey = async ({ secretjs, poolAddress, viewingKey }: SetStakingKeyParams) => {
  try {
    const stakingInfo = getStakingContractInfoForPool(poolAddress);
    if (!stakingInfo) {
      throw new Error(`No staking contract found for pool ${poolAddress}`);
    }

    const stakingContractAddress = stakingInfo.stakingAddress;
    const stakingContractCodeHash = stakingInfo.stakingCodeHash;

    console.log(`Setting viewing key on staking contract ${stakingContractAddress}`);

    const setKeyMsg = {
      set_viewing_key: {
        key: viewingKey,
      },
    };

    const setKeyTx = await secretjs.tx.compute.executeContract(
      {
        sender: secretjs.address,
        contract_address: stakingContractAddress,
        code_hash: stakingContractCodeHash,
        msg: setKeyMsg,
        sent_funds: [],
      },
      {
        gasLimit: 150_000,
      }
    );

    console.log('Set viewing key transaction result:', setKeyTx);

    if (setKeyTx.code !== TxResultCode.Success) {
      throw new Error(`Set viewing key transaction failed: ${setKeyTx.rawLog}`);
    }

    console.log('Viewing key set successfully on staking contract.');
    return setKeyTx;
  } catch (error) {
    console.error('Error setting staking viewing key:', error);
    throw error;
  }
};
