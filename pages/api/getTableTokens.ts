import { NextApiRequest, NextApiResponse } from "next";

const getTableTokens = (req: NextApiRequest, res: NextApiResponse) => {
  const tokens = [
    {
      userAddress: "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek",
      name: "SCRT",
      network: "Secret Network",
      price: "$0.10",
      change: "-5%",
      tvl: "$100K",
      volume: "$48K",
    },
    {
      userAddress: "secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt",
      name: "ADMT",
      network: "Secret Network",
      price: "$0.20",
      change: "10%",
      tvl: "$200K",
      volume: "$101K",
    },
  ];

  res.status(200).json(tokens);
};

export default getTableTokens;
