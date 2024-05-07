import { NextApiRequest, NextApiResponse } from "next";
import { fetchFromCoinGecko } from "@/utils/apis/coingecko-utils";

export default async function getCoingeckoPrice(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { symbol } = req.query;
  if (!symbol) {
    res.status(400).json({ error: "Missing symbol. Example: ?symbol=bitcoin" });
    return;
  }

  try {
    const data = await fetchFromCoinGecko(
      `/coins/markets?vs_currency=usd&ids=${symbol}`
    );
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// http://localhost:3000/api/getCoingeckoPrice?symbol=bitcoin
