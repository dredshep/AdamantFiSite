import { ContractPool } from '@/types/ContractPool';
import { SecretNetworkClient } from 'secretjs';
import isNotNullish from '../../isNotNullish';

export const queryPools = async (
  secretjs: SecretNetworkClient,
  contractAddress: string,
  contractCodeHash?: string
) => {
  const queryMsg = {
    pool: {}, // Update this line with the correct query structure
  };

  try {
    let code_hash: string | undefined;
    if (isNotNullish(contractCodeHash)) {
      code_hash = contractCodeHash;
    } else {
      const { code_hash: hash } = await secretjs.query.compute.codeHashByContractAddress({
        contract_address: contractAddress,
      });
      code_hash = hash;
    }
    const queryResult = await secretjs.query.compute.queryContract<
      typeof queryMsg,
      {
        assets: ContractPool[];
      }
    >(
      isNotNullish(code_hash)
        ? {
            contract_address: contractAddress,
            query: queryMsg,
            code_hash,
          }
        : {
            contract_address: contractAddress,
            query: queryMsg,
          }
    ); // Update the expected result type accordingly

    console.log('Query result:', JSON.stringify({ queryResult, code_hash }, null, 2));

    // If the structure is not known, log the entire result for inspection
    if (!isNotNullish(queryResult) || typeof queryResult !== 'object') {
      console.error('Unexpected query result format:', queryResult);
      return [];
    }

    // Extract the pools from the query result
    const pools: ContractPool[] = isNotNullish(queryResult.assets) ? queryResult.assets : [];
    return pools;
  } catch (error) {
    console.error('Error querying contract:', error);
    return [];
  }
};
