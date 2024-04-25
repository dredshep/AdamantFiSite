import { NextApiRequest, NextApiResponse } from "next";
import { fetchFromCoinGecko } from "@/utils/apis/coingecko-utils";

export default async function getCoingeckoCoinList(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const data = await fetchFromCoinGecko(`/coins/list`);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
