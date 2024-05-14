import { SwappableToken } from "@/types/Token";
import { transformTwoSwappableToken } from "./transformToSwappableToken";
import getUrl from "./getUrl";
import { AzureTokensToken } from "@/types/api/azure/tokens";
import { SecretToken } from "@/types/api/azure/secret_tokens";

export const getSwappableTokens = async (): Promise<SwappableToken[]> => {
  const response = await fetch(getUrl("/api/tokens"));
  const tokens = (await response.json()) as (AzureTokensToken | SecretToken)[];

  // Since the API response might include both types of tokens, we should handle them uniformly
  return transformTwoSwappableToken(tokens);
};
