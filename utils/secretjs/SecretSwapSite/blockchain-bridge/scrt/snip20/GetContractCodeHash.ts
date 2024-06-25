import { SecretNetworkClient } from "secretjs";

export const GetContractCodeHash = async ({
  secretjs,
  address,
}: {
  secretjs: SecretNetworkClient;
  address: string;
}): Promise<string | undefined> => {
  const response = await secretjs.query.compute.codeHashByContractAddress({
    contract_address: address,
  });
  return response.code_hash;
};
