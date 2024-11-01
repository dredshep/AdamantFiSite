import { Path, TokenPoolMap } from "@/types/estimation";
import { SecretNetworkClient } from "secretjs";
import { prepareGraph } from "./prepareGraph";
import { PriorityQueue } from "./PriorityQueue";

export const findOptimalPath = async (
  tokenPoolMap: TokenPoolMap,
  startToken: string,
  endToken: string,
  secretjs: SecretNetworkClient
): Promise<Path> => {
  const { edges, tokens } = await prepareGraph(tokenPoolMap, secretjs);

  const distances: { [token: string]: number } = {};
  const previous: { [token: string]: { token: string; pool: string } | null } =
    {};
  const queue = new PriorityQueue<{ token: string; cost: number }>(
    (a, b) => a.cost - b.cost
  );

  // Initialize distances and previous nodes
  tokens.forEach((token) => {
    distances[token] = Infinity;
    previous[token] = null;
  });
  distances[startToken] = 0;
  queue.enqueue({ token: startToken, cost: 0 });

  while (!queue.isEmpty()) {
    const { token: currentToken } = queue.dequeue()!;
    if (currentToken === endToken) {
      break; // Found the shortest path to the end token
    }

    const adjacentEdges = edges.filter((edge) => edge.from === currentToken);
    for (const edge of adjacentEdges) {
      const alt = distances[currentToken]! + edge.weight;
      if (alt < distances[edge.to]!) {
        distances[edge.to] = alt;
        previous[edge.to] = { token: currentToken, pool: edge.poolAddress };
        queue.enqueue({ token: edge.to, cost: alt });
      }
    }
  }

  // Reconstruct the optimal path
  const pathTokens: string[] = [];
  const pathPools: string[] = [];
  let currentToken = endToken;
  while (previous[currentToken]) {
    pathTokens.unshift(currentToken);
    pathPools.unshift(previous[currentToken]!.pool);
    currentToken = previous[currentToken]!.token;
  }
  if (currentToken !== startToken) {
    throw new Error("No path found between the specified tokens.");
  }
  pathTokens.unshift(startToken);

  return { tokens: pathTokens, pools: pathPools };
};
