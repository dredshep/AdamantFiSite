import { Token } from "@/types/Token";
import { NextApiRequest, NextApiResponse } from "next";

export default function getSwappableTokens(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const dummyTokens = [
    {
      symbol: "sSCRT",
      address: "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek",
    },
    {
      symbol: "SEFI",
      address: "secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt",
    },
    {
      symbol: "sAAVE",
      address: "secret1yxwnyk8htvvq25x2z87yj0r5tqpev452fk6h5h",
    },
  ] as Token[];

  res.status(200).json(dummyTokens);
}
