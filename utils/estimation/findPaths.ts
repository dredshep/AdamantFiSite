import { Path, TokenPoolMap } from "@/types/estimation";
import { fetchPoolData } from ".";

export const findPaths = (
  tokenPoolMap: TokenPoolMap,
  startToken: string,
  endToken: string,
  maxHops: number = 3
): Path[] => {
  const paths: Path[] = [];
  // Set to keep track of visited tokens to avoid infinite loops
  const visited: Set<string> = new Set();

  // Depth-first search to find all paths
  const dfs = async (currentToken: string, path: Path, hops: number) => {
    if (hops > maxHops || visited.has(currentToken)) return;
    if (currentToken === endToken) {
      paths.push({ pools: [...path.pools], tokens: [...path.tokens] });
      return;
    }

    const fullPoolsData = await fetchPoolData();
    visited.add(currentToken);

    const pools = tokenPoolMap[currentToken] ?? [];
    pools.forEach((poolAddress) => {
      const poolTokens = fullPoolsData
        .find((pool) => pool.contract_address === poolAddress)
        ?.query_result.assets.filter((asset) => asset.info.token !== undefined)
        .map((asset) => asset.info.token!.contract_addr);

      poolTokens?.forEach((nextToken) => {
        if (nextToken !== currentToken) {
          path.pools.push(poolAddress);
          path.tokens.push(nextToken);
          void dfs(nextToken, path, hops + 1);
          path.pools.pop();
          path.tokens.pop();
        }
      });
    });

    visited.delete(currentToken);
  };

  void dfs(startToken, { pools: [], tokens: [startToken] }, 0);

  return paths;
};
