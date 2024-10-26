const baseUrl = process.env["COINGECKO_API_URL"]!;
const apiKey = process.env["COINGECKO_API_KEY"]!;
const authHeader = process.env["COINGECKO_AUTH_HEADER"]!;
import {
  MissingApiKeyError,
  MissingAuthHeaderError,
  MissingApiUrlError,
  HttpResponseError,
} from "@/utils/errors/apiErrors";

export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
}

export type CoinGeckoCoinListResponse = CoinGeckoCoin[];

export async function fetchFromCoinGecko(endpoint: string) {
  if (!("COINGECKO_API_KEY" in process.env)) {
    throw new MissingApiKeyError(
      "Missing COINGECKO_API_KEY in root .env.local. Guide to get it: https://github.com/dredshep/AdamantFiSite/blob/main/docs/api/CoinGecko%20API/CoinGecko%20API%20Integration.md"
    );
  }
  if (!("COINGECKO_AUTH_HEADER" in process.env)) {
    throw new MissingAuthHeaderError(
      "Missing COINGECKO_AUTH_HEADER in root .env.local. If you're using the free plan, set it to x-cg-demo-api-key; for the pro plan, set it to x-cg-pro-api-key"
    );
  }
  if (!("COINGECKO_API_URL" in process.env)) {
    throw new MissingApiUrlError(
      "Missing COINGECKO_API_URL in root .env.local. If you're using the free plan, set it to https://api.coingecko.com/api/v3; for the pro plan, set it to pro-api.coingecko.com"
    );
  }

  const url = `${baseUrl}${endpoint}`;
  console.log(url);
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      [authHeader]: apiKey,
    },
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new HttpResponseError(
      `HTTP error! status: ${response.status}, error: ${response.statusText}`,
      response.status
    );
  }
  return (await response.json()) as CoinGeckoCoinListResponse;
}

// sample request: https://api.coingecko.com/api/v3/coins/list
