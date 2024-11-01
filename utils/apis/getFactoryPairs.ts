import { SecretNetworkClient } from "secretjs";
import { Pair, PairsResponse } from "@/types/api/Factory";

let cachedPairs: Pair[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// TODO: have a single client somewhere to import instead.
const secretjs = new SecretNetworkClient({
  url: "https://rpc.ankr.com/http/scrt_cosmos",
  chainId: "secret-4",
});

export async function queryFactoryPairs() {
  if (
    cachedPairs &&
    cacheTimestamp !== null &&
    Date.now() - cacheTimestamp < CACHE_DURATION
  ) {
    console.log("Returning cached pairs.");
    return cachedPairs;
  }

  const { pairs }: PairsResponse = await secretjs.query.compute.queryContract({
    contract_address: "secret1y2apaye99rfruz29jx4cmnpcmf87xr9uz5vrmd",
    code_hash:
      "16ea6dca596d2e5e6eef41df6dc26a1368adaa238aa93f07959841e7968c51bd",
    query: { pairs: { limit: 100 } },
  });

  console.log(`Got ${pairs.length} pairs.`);

  cachedPairs = pairs;
  cacheTimestamp = Date.now();

  return pairs;
}
