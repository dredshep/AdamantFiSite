import { NextApiRequest, NextApiResponse } from "next";
import { handleApiError } from "@/utils/apis/handleApiError";
import { queryPool } from "@/utils/apis/getPairPool";

export default async function getPoolInfo(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { contract_addr } = req.query;

  if (!contract_addr || typeof contract_addr !== "string") {
    return res
      .status(400)
      .json({ error: "contract_addr query parameter is required" });
  }

  try {
    const data = await queryPool(contract_addr);
    res.status(200).json(data);
  } catch (error) {
    handleApiError(error, res);
  }
}
