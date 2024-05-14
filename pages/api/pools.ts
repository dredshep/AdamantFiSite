// rawApiEndpoint.ts

import { NextApiRequest, NextApiResponse } from "next";
import { AzureTokensToken } from "@/types/api/azure/tokens"; // Adjust the import path as necessary
import { fetchAndTransform } from "@/utils/apis/fetchAndTransform";

export default async function handleRawApiRequest(
  _: NextApiRequest,
  res: NextApiResponse<AzureTokensToken[] | { error: string }>
) {
  const apiUrl = "https://api-bridge-mainnet.azurewebsites.net/secret_tokens";
  try {
    // Fetch data from the raw API endpoint
    const tokens = await fetchAndTransform<AzureTokensToken[]>(apiUrl);

    res.status(200).json(tokens);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
}
