// rawApiEndpoint.ts

import { NextApiRequest, NextApiResponse } from "next";
import {
  AzureTokensResponse,
  AzureTokensToken,
} from "@/types/api/azure/tokens";
import { fetchAndTransform } from "@/utils/apis/fetchAndTransform";
import {
  AzureSecretTokensResponse,
  SecretToken,
} from "@/types/api/azure/secret_tokens";
export type LocalTokensResponse = (AzureTokensToken | SecretToken)[];

export default async function handleRawApiRequest(
  _: NextApiRequest,
  res: NextApiResponse<(AzureTokensToken | SecretToken)[] | { error: string }>,
) {
  const apiUrl1 = "https://api-bridge-mainnet.azurewebsites.net/tokens";

  const apiUrl2 = "https://bridge-bsc-mainnet.azurewebsites.net/tokens/";
  const apiUrl3 = "https://api-bridge-mainnet.azurewebsites.net/secret_tokens/";

  try {
    const tokens1 = await fetchAndTransform<AzureTokensResponse>(apiUrl1);
    const tokens2 = await fetchAndTransform<AzureTokensResponse>(apiUrl2);
    const tokens3 = await fetchAndTransform<AzureSecretTokensResponse>(apiUrl3);

    // Combine the tokens from both sources
    const tokens = [...tokens1.tokens, ...tokens2.tokens, ...tokens3.tokens];
    // push an object with this address: secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek, name: sSCRT, decimals: 6, and a few more
    // tokens.push({
    //   name: "sSCRT",
    //   address: "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek",
    //   decimals: 6,
    //   hidden: false,
    //   usage: ["SWAP", "LPSTAKING", "BRIDGE"],
    //   price: "2.73",
    //   id: "none",
    //   display_props: {
    //     image:
    //       "https://assets.coingecko.com/coins/images/11871/standard/secret_logo.png?1696511740",
    //     symbol: "sSCRT",
    //     label: "sSCRT",
    //   },
    //   _id: "none",
    //   dst_address: "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek",
    // } as SecretToken);

    res.status(200).json(tokens);
  } catch (error) {
    // res.status(500).json({ error: error.message || "Something went wrong" });
    // gota use the address of the file so we know where we are debugging
    if (error instanceof Error) {
      res.status(500).json({
        error: "@/pages/api/rawApiEndpoint.ts:" +
          (error.message || "Something went wrong"),
      });
    } else {
      res.status(500).json({
        error: "@/pages/api/rawApiEndpoint.ts:An unknown error occurred",
      });
    }
  }
}
