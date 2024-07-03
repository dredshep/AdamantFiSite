// TokenInfo.ts
import { AzureTokensToken } from "@/types/api/azure";
import { SecretToken } from "@/types/api/azure/secret_tokens";

// Define an interface for the token details
interface TokenDetails {
  name: string;
  decimals: number;
}

// Store token data in a map for quick access
const tokenData = new Map<string, TokenDetails>();

// Fetch token data from the API and populate the map
export const fetchTokenData = async (apiUrl: string): Promise<void> => {
  try {
    const response = await fetch(apiUrl);
    const data = (await response.json()) as (AzureTokensToken | SecretToken)[];
    data.forEach((token) => {
      const address = "address" in token ? token.address : token.dst_address;
      if (address) {
        tokenData.set(address, {
          name: token.name,
          decimals: token.decimals,
        });
      }
    });
  } catch (error) {
    console.error("Error fetching token data:", error);
  }
};

// Get token name by address
export const getTokenName = (address: string): string | undefined => {
  const internalMapping = {
    secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek: "sSCRT",
    secret1xzlgeyuuyqje79ma6vllregprkmgwgavk8y798: "FATS",
    uscrt: "USCRT",
    secret1rgm2m5t530tdzyd99775n6vzumxa5luxcllml4: "SIENNA",
  } as { [key: string]: string };
  const attemptedName = tokenData.get(address)?.name;
  if (typeof attemptedName === "string") {
    return attemptedName;
  }
  const internalName = internalMapping[address];

  if (internalName) {
    return `${internalName}`;
  }
  return undefined;
};

// Get token decimals by address
export const getTokenDecimals = (address: string): number | undefined => {
  return tokenData.get(address)?.decimals;
};
