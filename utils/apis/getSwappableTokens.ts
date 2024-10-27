import { SwappableToken } from "@/types/Token";
import { transformToSwappableToken } from "./transformToSwappableToken";
import getUrl from "./getUrl";
import { AzureTokensToken } from "@/types/api/azure/tokens";
import { SecretToken } from "@/types/api/azure/secret_tokens";
import axios from "axios";

export const getSwappableTokens = async (): Promise<SwappableToken[]> => {
  // alert(getUrl("/api/tokens"));
  let tokens = [] as (AzureTokensToken | SecretToken)[];
  try {
    const response = await axios.get(getUrl("/api/tokens"));
    // tokens = (await response.json()) as (AzureTokensToken | SecretToken)[];
    if (typeof response.data === "string") {
      tokens = JSON.parse(response.data) as (AzureTokensToken | SecretToken)[];
    } else if (typeof response.data === "object") {
      tokens = response.data as (AzureTokensToken | SecretToken)[];
    }
  } catch (error) {
    console.error(error);
  }

  // Since the API response might include both types of tokens, we should handle them uniformly
  return transformToSwappableToken(tokens);
};
