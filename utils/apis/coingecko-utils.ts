const baseUrl = process.env.COINGECKO_API_URL;
const apiKey = process.env.COINGECKO_API_KEY;
const authHeader = process.env.COINGECKO_AUTH_HEADER;

export async function fetchFromCoinGecko(endpoint: string) {
  if (!apiKey) {
    throw new Error(
      "Missing COINGECKO_API_KEY in root .env.local. Guide to get it: https://github.com/dredshep/AdamantFiSite/blob/main/docs/api/CoinGecko%20API/CoinGecko%20API%20Integration.md"
    );
  }
  if (!authHeader) {
    throw new Error(
      "Missing COINGECKO_AUTH_HEADER in root .env.local. If you're using the free plan, set it to x-cg-demo-api-key; for the pro plan, set it to x-cg-pro-api-key"
    );
  }
  if (!baseUrl) {
    throw new Error(
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
    throw new Error(
      `HTTP error! status: ${response.status}, error: ${response.statusText}`
    );
  }
  return await response.json();
}
