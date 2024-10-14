import { NextApiRequest, NextApiResponse } from "next";
import { handleApiError } from "@/utils/apis/handleApiError";
import { queryPools } from "@/utils/apis/getPairPools";

export default async function getPools(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const data = await queryPools();
    res.status(200).json(data);
  } catch (error) {
    handleApiError(error, res);
  }
}
