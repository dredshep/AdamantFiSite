import { Token } from "@/types";

import { transformToSwappableToken } from "./transformAzureTokenIntoSwappableToken";
import { AzureTokensResponse } from "@/types/api/azure";

export const getSwappableTokens = async (): Promise<Token[]> => {
  const response = await fetch("/api/tokens");
  const data = (await response.json()) as AzureTokensResponse;
  return transformToSwappableToken(data.tokens);
};
