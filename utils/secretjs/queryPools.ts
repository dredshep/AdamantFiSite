import { SecretNetworkClient } from "secretjs";
import { ContractPool } from "@/types/ContractPool";

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
    if (contractCodeHash) {
      code_hash = contractCodeHash;
    } else {
      const { code_hash: hash } =
        await secretjs.query.compute.codeHashByContractAddress({
          contract_address: contractAddress,
        });
      code_hash = hash;
    }
    const queryResult = (await secretjs.query.compute.queryContract({
      contract_address: contractAddress,
      query: queryMsg,
      code_hash,
    })); // Update the expected result type accordingly

    console.log(
      "Query result:",
      JSON.stringify({ queryResult, code_hash }, null, 2)
    );

    // If the structure is not known, log the entire result for inspection
    if (!queryResult || typeof queryResult !== "object") {
      console.error("Unexpected query result format:", queryResult);
      return [];
    }

    // Extract the pools from the query result
    const pools: ContractPool[] = queryResult.assets || [];
    return pools;
  } catch (error) {
    console.error("Error querying contract:", error);
    return [];
  }
};
