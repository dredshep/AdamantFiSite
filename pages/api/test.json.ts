// rawApiEndpoint.ts

import { NextApiRequest, NextApiResponse } from "next";
import {
  AzureTokensResponse,
  AzureTokensToken,
} from "@/types/api/azure/tokens";
import { fetchAndTransform } from "@/utils/apis/fetchAndTransform";
import {
  SecretToken,
  AzureSecretTokensResponse,
} from "@/types/api/azure/secret_tokens";

export default async function handleRawApiRequest(
  _: NextApiRequest,
  res: NextApiResponse<(AzureTokensToken | SecretToken)[] | { error: string }>
) {
  const apiUrl1 = "https://api-bridge-mainnet.azurewebsites.net/tokens";

  const apiUrl2 = "https://bridge-bsc-mainnet.azurewebsites.net/tokens/";
  const apiUrl3 = "https://api-bridge-mainnet.azurewebsites.net/secret_tokens/";

  try {
    // Fetch data from the raw API endpoint
    // const tokens = await fetchAndTransform<AzureTokensToken[]>(apiUrl);
    const tokens1 = await fetchAndTransform<AzureTokensResponse>(apiUrl1);
    const tokens2 = await fetchAndTransform<AzureTokensResponse>(apiUrl2);
    const tokens3 = await fetchAndTransform<AzureSecretTokensResponse>(apiUrl3);

    // Combine the tokens from both sources
    const tokens = [...tokens1.tokens, ...tokens2.tokens, ...tokens3.tokens];

    res.status(200).json(tokens);
  } catch (error) {
    // res.status(500).json({ error: error.message || "Something went wrong" });

    // gota use the address of the file so we know where we are debugging

    if (error instanceof Error) {
      res.status(500).json({
        error:
          "@/pages/api/rawApiEndpoint.ts:" +
          (error.message || "Something went wrong"),
      });
    } else {
      res.status(500).json({
        error: "@/pages/api/rawApiEndpoint.ts:An unknown error occurred",
      });
    }
  }
}
