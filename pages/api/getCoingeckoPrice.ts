import { NextApiRequest, NextApiResponse } from "next";
import {
  fetchFromCoinGecko,
  CoinGeckoEndpoint,
} from "@/utils/apis/coingecko-utils";
import { handleApiError } from "@/utils/apis/handleApiError";

export default async function getCoingeckoPrice(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { symbol } = req.query;
  if (
    typeof symbol === undefined ||
    (Array.isArray(symbol) && symbol.length === 0) ||
    typeof symbol !== "string" ||
    symbol.length === 0 ||
    (Array.isArray(symbol) &&
      symbol.length === 1 &&
      typeof symbol[0] === "string" &&
      symbol[0].length === 0)
  ) {
    res.status(400).json({ error: "Missing symbol. Example: ?symbol=bitcoin" });
    return;
  }

  try {
    const data = await fetchFromCoinGecko(CoinGeckoEndpoint.CoinMarket, {
      vs_currency: "usd",
      ids: symbol,
    });
    res.status(200).json(data);
  } catch (error) {
    handleApiError(error, res);
  }
}
