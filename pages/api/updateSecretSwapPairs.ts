import { NextApiRequest, NextApiResponse } from "next";
import { SecretNetworkClient } from "secretjs";
import { handleApiError } from "@/utils/apis/handleApiError";
import { Pair } from "@/types/api/Factory";
import { queryFactoryPairs } from "@/utils/apis/factoryPairs";

// Set up in-memory cache
let pairsCache: Record<string, Pair> = {}; // Stores pairs data
let lastCacheTime: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

const secretNodeUrl: string =
  process.env.secretNodeUrl || "https://rpc.ankr.com/http/scrt_cosmos";
const secretChainId: string = process.env.secretChainId || "secret-4";
const factoryContract: string =
  process.env.factoryContract ||
  "secret1fjqlk09wp7yflxx7y433mkeskqdtw3yqerkcgp";
const pairCodeId: string = process.env.pairCodeId || "39";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (lastCacheTime && Date.now() - lastCacheTime < CACHE_DURATION) {
    console.log("Serving data from cache.");
    return res.status(200).json(pairsCache);
  }

  const secretjs = new SecretNetworkClient({
    url: secretNodeUrl,
    chainId: secretChainId,
  });

  // NOTE: This method relies on finding new pair contracts based on the code_id
  // and label, instead of querying the factory contract

  // let pairsAddresses: string[] = [];
  // try {
  //   const { contract_infos } = await secretjs.query.compute.contractsByCodeId({
  //     code_id: pairCodeId,
  //   });
  //   pairsAddresses = contract_infos!
  //     .filter((p) =>
  //       p.contract_info!.label!.endsWith(`${factoryContract}-${pairCodeId}`),
  //     )
  //     .map((p) => p.contract_address!);
  // } catch (error) {
  //   handleApiError(error, res);
  // }
  //
  // if (pairsAddresses.length === 0) {
  //   console.log("No new pairs.");
  //   return res.status(200).json({ message: "No new pairs" });
  // }

  // Gets all pairs in a single request (not great long-term, but OK for now)
  let pairs: Pair[] = await queryFactoryPairs();

  // try {
  //   pairs = (
  //     await Promise.all(
  //       pairsAddresses.map((addr) =>
  //         secretjs.query.compute.queryContract<{ pair: {} }, Pair>({
  //           contract_address: addr,
  //           query: { pair: {} },
  //         }),
  //       ),
  //     )
  //   ).map((p) => {
  //     p._id = p.contract_addr;
  //     return p;
  //   });
  // } catch (error) {
  //   handleApiError(error, res);
  // }

  pairsCache = pairs.reduce(
    (acc, pair) => {
      acc[pair.contract_addr] = pair;
      return acc;
    },
    {} as Record<string, Pair>,
  );

  lastCacheTime = Date.now();

  return res.status(200).json(pairsCache);
}
