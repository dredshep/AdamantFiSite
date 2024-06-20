import { SecretNetworkClient } from "secretjs";
import { PairMap, SwapPair } from "../types/SwapPair";
import { Token } from "../types/trade";

function getTokenDetails(
  fromToken: string,
  pair: SwapPair | undefined
): { address: string; code_hash: string } | "scrt" {
  if (fromToken === "uscrt") {
    return "scrt";
  } else {
    const tokenInfo = pair?.asset_infos.find(
      (a) => (a.info as Token)?.token?.contract_addr === fromToken
    )?.info as Token;

    return {
      address: fromToken,
      code_hash: tokenInfo.token.token_code_hash,
    };
  }
}

// getTokenDetails("secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek", undefined);

function getPairCodeHash(
  pair_address: string,
  secretjs: SecretNetworkClient
): Promise<string> {
  return SwapPair.getPairCodeHash(pair_address, secretjs);
}

async function constructHop(
  fromToken: string,
  toToken: string,
  pairs: PairMap,
  secretjs: SecretNetworkClient
) {
  const pair = pairs.get(`${fromToken}${SwapPair.id_delimiter}${toToken}`);
  if (!pair) {
    return null;
  }

  const from_token = getTokenDetails(fromToken, pair);
  const pair_code_hash = await getPairCodeHash(pair.contract_addr, secretjs);

  return {
    from_token,
    pair_address: pair.contract_addr,
    pair_code_hash,
  };
}

export async function getHops(
  bestRoute: string[],
  pairs: PairMap,
  secretjs: SecretNetworkClient
) {
  const hops = await Promise.all(
    bestRoute.slice(0, -1).map(async (fromToken, idx) => {
      const toToken = bestRoute[idx + 1];
      return constructHop(fromToken, toToken, pairs, secretjs);
    })
  );
  return hops.filter((x) => x !== null);
}
