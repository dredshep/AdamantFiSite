import type { NextApiRequest, NextApiResponse } from "next";
import {
  AzureTokensResponse,
  AzureTokensToken,
} from "@/types/api/azure/tokens"; // Adjust the import path as necessary

async function fetchTokensFromAPI(url: string): Promise<AzureTokensToken[]> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`API call failed with HTTP status ${response.status}`);
  }

  const data: AzureTokensResponse = await response.json();
  return data.tokens;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ tokens: AzureTokensToken[] } | { error: string }>
) {
  const apiUrl1 = "https://api-bridge-mainnet.azurewebsites.net/tokens";
  const apiUrl2 =
    "https://bridge-bsc-mainnet.azurewebsites.net/tokens/?page=0&size=1000";

  try {
    // Fetch data from both APIs in parallel
    const [tokens1, tokens2] = await Promise.all([
      fetchTokensFromAPI(apiUrl1),
      fetchTokensFromAPI(apiUrl2),
    ]);

    // Combine the tokens from both sources
    const combinedTokens = [...tokens1, ...tokens2];

    res.status(200).json({ tokens: combinedTokens });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
}

export default handler;

// http://localhost:3000/api/tokens
