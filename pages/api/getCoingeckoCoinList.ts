import { NextApiRequest, NextApiResponse } from "next";
import { fetchFromCoinGecko } from "@/utils/apis/coingecko-utils";
import { handleApiError } from "@/utils/apis/handleApiError";

export default async function getCoingeckoCoinList(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const data = await fetchFromCoinGecko(`/coins/list`);
    res.status(200).json(data);
  } catch (error) {
    handleApiError(error, res);
  }
}
