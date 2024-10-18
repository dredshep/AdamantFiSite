import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

export interface PriceData {
  [tokenId: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

export async function getPrices(): Promise<PriceData> {
  try {
    const response = await axios.get<PriceData>(
      `${COINGECKO_API_URL}/simple/price?ids=secret,ethereum,cosmos&vs_currencies=usd&include_24hr_change=true`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching price data:", error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PriceData | { error: string }>
) {
  try {
    const prices = await getPrices();
    res.status(200).json(prices);
  } catch (error: unknown) {
    console.error("Error fetching price data:", error);
    res.status(500).json({ error: "Failed to fetch price data" });
  }
}
