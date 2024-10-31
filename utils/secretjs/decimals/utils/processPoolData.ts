import { SecretNetworkClient } from "secretjs";
import { FullPoolsData } from "../types/FullPoolsData";
import { getTokenDetails } from "./getTokenDetails";
import { Dispatch, SetStateAction } from "react";

interface TokenData {
  contract_addr: string;
  decimals: number;
  token_name: string;
}

export const processPoolsData = async (
  secretjs: SecretNetworkClient,
  fullPoolsData: FullPoolsData,
  onError: (error: string) => void,
  setTokenDetails: Dispatch<SetStateAction<TokenData[]>>
): Promise<void> => {
  if (secretjs === undefined) return;

  const sSCRTAddress = "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek";

  const fetchTokenDetails = async (
    asset: FullPoolsData[number]["query_result"]["assets"][0],
    expectedTokenName: string
  ): Promise<TokenData | null> => {
    if ("native_token" in asset.info) {
      return {
        contract_addr: sSCRTAddress,
        decimals: 6,
        token_name: "sSCRT",
      };
    } else if ("token" in asset.info) {
      const tokenInfo = asset.info.token;
      const details = await getTokenDetails(
        secretjs,
        tokenInfo.contract_addr,
        tokenInfo.token_code_hash,
        onError
      );
      if (!details) return null;

      const tokenName =
        tokenInfo.contract_addr === sSCRTAddress ? "sSCRT" : expectedTokenName;
      return {
        contract_addr: tokenInfo.contract_addr,
        token_name: tokenName,
        decimals: details.decimals,
      };
    }
    return null;
  };

  const promises = fullPoolsData.flatMap((pool) => {
    const pairNames = pool.pair.split("-");
    if (pairNames.length !== pool.query_result.assets.length) {
      onError("Invalid pool data: pair names and assets length mismatch");
      return [];
    }
    if (pairNames.some((name) => name === undefined)) {
      onError("Invalid pool data: pair names contain undefined");
      return [];
    }
    return pool.query_result.assets.map((asset, index) =>
      pairNames[index] !== undefined
        ? fetchTokenDetails(asset, pairNames[index])
        : null
    );
  });

  try {
    const tokenDetails = (await Promise.all(promises)).filter(
      Boolean
    ) as TokenData[];

    // Deduplicate by token address
    const uniqueTokenDetails = tokenDetails.reduce<{
      [key: string]: TokenData;
    }>((acc, token) => {
      if (!acc[token.contract_addr]) {
        acc[token.contract_addr] = token;
      } else {
        // Ensure that we prioritize the sSCRT token name if multiple entries occur
        if (token.token_name === "sSCRT") {
          acc[token.contract_addr] = token;
        }
      }
      return acc;
    }, {});

    setTokenDetails(Object.values(uniqueTokenDetails));
  } catch (error) {
    onError("Error processing pool data: " + (error as Error).message);
  }
};
