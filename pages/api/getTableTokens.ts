// @/api/getTableTokens.ts

import { TableToken, Token } from "@/types";
import {
  getApiTokenAddress,
  getApiTokens,
  getApiTokenSymbol,
} from "@/utils/apis/getSwappableTokens";
import { NextApiRequest, NextApiResponse } from "next";

// Define your transformation function
const transformTokensToTableFormat = (tokens: Token[]): TableToken[] => {
  return tokens.map((token) => ({
    address: getApiTokenAddress(token),
    name: getApiTokenSymbol(token),
    // network: getApiTokenNetwork(token),
    // price: token.usdPrice ?? "N/A",
    change: "0%", // Assuming you will compute this based on some other data
    tvl: "N/A", // You might need additional data for Total Volume Locked
    volume: "N/A", // You might need additional data for Volume
  }));
};

// API Route that uses the transformation
const getTableTokens = async (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    const swappableTokens = await getApiTokens(); // Fetch the tokens from the other API
    const tableTokens = transformTokensToTableFormat(swappableTokens); // Transform them to table format
    res.status(200).json(tableTokens);
  } catch (error) {
    console.error(
      "@/pages/api/getTableTokens.ts: Failed to fetch tokens",
      error
    );
    res
      .status(500)
      .json({ error: "@/pages/api/getTableTokens.ts: Failed to fetch tokens" });
  }
};

export default getTableTokens;
