// @/api/getTableTokens.ts

import { NextApiRequest, NextApiResponse } from "next";
import { getSwappableTokens } from "@/utils/apis/getSwappableTokens";
import { TableToken, Token } from "@/types";

// Define your transformation function
const transformTokensToTableFormat = (tokens: Token[]): TableToken[] => {
  return tokens.map((token) => ({
    address: token.address,
    name: token.name ?? "Unknown Token",
    network: token.network ?? "Unknown Network",
    price: token.usdPrice ?? "N/A",
    change: "0%", // Assuming you will compute this based on some other data
    tvl: "N/A", // You might need additional data for Total Volume Locked
    volume: "N/A", // You might need additional data for Volume
  }));
};

// API Route that uses the transformation
const getTableTokens = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const swappableTokens = await getSwappableTokens(); // Fetch the tokens from the other API
    const tableTokens = transformTokensToTableFormat(swappableTokens); // Transform them to table format
    res.status(200).json(tableTokens);
  } catch (error) {
    console.error(
      "@pages/api/getTableTokens.ts: Failed to fetch tokens",
      error
    );
    res
      .status(500)
      .json({ error: "@pages/api/getTableTokens.ts: Failed to fetch tokens" });
  }
};

export default getTableTokens;
