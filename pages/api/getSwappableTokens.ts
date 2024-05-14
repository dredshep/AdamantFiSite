import { NextApiRequest, NextApiResponse } from "next";
import { AzureTokensToken } from "@/types/api/azure/tokens"; // Adjust the import path as necessary
import { fetchAndTransform } from "@/utils/apis/fetchAndTransform";

function transformTokensData(data: any): AzureTokensToken[] {
  return data.tokens;
}

export default async function handleTransformedApiRequest(
  _: NextApiRequest,
  res: NextApiResponse<AzureTokensToken[] | { error: string }>
) {
  const apiUrl =
    "https://bridge-bsc-mainnet.azurewebsites.net/tokens/?page=0&size=1000";

  try {
    // Fetch data from the transformed API endpoint and transform it
    const tokens = await fetchAndTransform<AzureTokensToken[]>(
      apiUrl,
      transformTokensData
    );

    res.status(200).json(tokens);
  } catch (error: any) {
    res.status(500).json({
      error:
        "@/pages/api/getSwappableTokens.ts:" +
        (error.message || "Something went wrong"),
    });
  }
}

// http://localhost:3000/api/swappable_tokens
