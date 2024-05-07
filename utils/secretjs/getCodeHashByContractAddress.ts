import { createClient } from "./createClient";

export default async function getCodeHashByContractAddress(
  contractAddress: string
) {
  const client = await createClient();
  try {
    const contractInfo = await client.query.compute.contractInfo({
      contract_address: contractAddress,
    });
    return contractInfo.contract_info?.code_id;
  } catch (error) {
    console.error("Failed to fetch the code hash:", error);
    throw error;
  }
}
