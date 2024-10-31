// import { Token } from "@/types/Token";
// import { NextApiRequest, NextApiResponse } from "next";

// export default function getSwappableTokens(
//   _: NextApiRequest,
//   res: NextApiResponse
// ) {
//   const dummyTokens: Token[] = [
//     {
//       symbol: "sSCRT",
//       address: "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek",
//       isNativeToken: false,
//       balance: "1000",
//       viewingKey: "viewingKey1",
//       protocol: "protocol1",
//       network: "network1",
//       decimals: 18,
//       iconUrl: "iconUrl1",
//       name: "name1",
//       description: "description1",
//       usdPrice: "usdPrice1",
//       priceVsNativeToken: "priceVsNativeToken1",
//     },
//     {
//       symbol: "SEFI",
//       address: "secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt",
//       isNativeToken: false,
//       balance: "2000",
//       viewingKey: "viewingKey2",
//       protocol: "protocol2",
//       network: "network2",
//       decimals: 18,
//       iconUrl: "iconUrl2",
//       name: "name2",
//       description: "description2",
//       usdPrice: "usdPrice2",
//       priceVsNativeToken: "priceVsNativeToken2",
//     },
//     {
//       symbol: "sAAVE",
//       address: "secret1yxwnyk8htvvq25x2z87yj0r5tqpev452fk6h5h",
//       isNativeToken: false,
//       balance: "3000",
//       viewingKey: "viewingKey3",
//       protocol: "protocol3",
//       network: "network3",
//       decimals: 18,
//       iconUrl: "iconUrl3",
//       name: "name3",
//       description: "description3",
//       usdPrice: "usdPrice3",
//       priceVsNativeToken: "priceVsNativeToken3",
//     },
//   ];

//   res.status(200).json(dummyTokens);
// }
