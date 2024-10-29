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

// prettier-ignore
export interface CoinGeckoCoinMarket {
  id:                               string;
  symbol:                           string;
  name:                             string;
  image:                            string;
  current_price:                    number;
  market_cap:                       number;
  market_cap_rank:                  number;
  fully_diluted_valuation:          number;
  total_volume:                     number;
  high_24h:                         number;
  low_24h:                          number;
  price_change_24h:                 number;
  price_change_percentage_24h:      number;
  market_cap_change_24h:            number;
  market_cap_change_percentage_24h: number;
  circulating_supply:               number;
  total_supply:                     number;
  max_supply:                       number;
  ath:                              number;
  ath_change_percentage:            number;
  ath_date:                         Date;
  atl:                              number;
  atl_change_percentage:            number;
  atl_date:                         Date;
  roi:                              null;
  last_updated:                     Date;
}

// export type CoinGeckoCoinListResponse = CoinGeckoCoin[];
// export type CoinGeckoCoinMarketResponse = CoinGeckoCoinMarket[];

export enum CoinGeckoEndpoint {
  CoinList = "/coins/list",
  CoinMarket = "/coins/markets",
}

export enum CoinGeckoResponse {
  CoinList = "COIN_LIST",
  CoinMarket = "COIN_MARKET",
}

// Define response type mapping
export type CoinGeckoResponseType = {
  [CoinGeckoEndpoint.CoinList]: CoinGeckoCoin[];
  [CoinGeckoEndpoint.CoinMarket]: CoinGeckoCoinMarket[];
};

export interface CoinGeckoOptions {
  [CoinGeckoEndpoint.CoinMarket]: {
    vs_currency: string;
    ids: string;
  };
  [CoinGeckoEndpoint.CoinList]: undefined;
}

export async function fetchFromCoinGecko<T extends CoinGeckoEndpoint>(
  endpoint: T,
  options?: CoinGeckoOptions[T]
): Promise<CoinGeckoResponseType[T]> {
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

  let url = `${baseUrl}${endpoint}`;
  if (options) {
    const params = new URLSearchParams(options as Record<string, string>);
    url += `?${params.toString()}`;
  }

  const fetchOptions = {
    method: "GET",
    headers: {
      accept: "application/json",
      [authHeader]: apiKey,
    },
  };

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    throw new HttpResponseError(
      `HTTP error! status: ${response.status}, error: ${response.statusText}`,
      response.status
    );
  }

  return (await response.json()) as CoinGeckoResponseType[T];
}

// sample request: https://api.coingecko.com/api/v3/coins/list
