import { NextApiRequest, NextApiResponse } from "next";
import { queryFactoryPairs } from "@/utils/apis/getFactoryPairs";
import { handleApiError } from "@/utils/apis/handleApiError";

export default async function getFactoryPairs(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const data = await queryFactoryPairs();
    res.status(200).json(data);
  } catch (error) {
    handleApiError(error, res);
  }
}
