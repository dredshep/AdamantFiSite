// utils/queryPools.ts

import { SecretNetworkClient } from "secretjs";
import { ContractPool } from "@/types/ContractPool"; // Adjust the import path as necessary

export const queryPools = async (
  secretjs: SecretNetworkClient,
  contractAddress: string,
) => {
  const queryMsg = {
    pools: {},
  };

  // try {
  const queryResult = (await secretjs.query.compute.queryContract({
    contract_address: contractAddress,
    query: queryMsg,
  })) as { pools: ContractPool[] };

  console.log("Query result:", queryResult);

  // If the structure is not known, log the entire result for inspection
  if (!queryResult || typeof queryResult !== "object") {
    console.error("Unexpected query result format:", queryResult);
    return [];
  }

  // Extract the pools from the query result
  const pools: ContractPool[] = queryResult.pools || [];
  return pools;
};
