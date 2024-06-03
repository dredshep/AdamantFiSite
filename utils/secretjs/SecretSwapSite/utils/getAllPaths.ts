import { cloneDeep } from 'lodash';

const MAX_PATH_LENGTH = 5; // The longest path this function will find.  Complexity is O(n!)

export function getAllPaths(graph, tokenSource, tokenDest, tokens): string[][] {
  let currentPath = [];
  let pathList = [];

  dfs(tokenSource, tokenDest); // Call recursive function

  return pathList;

  // Depth-first-search
  function dfs(tokenA, tokenB) {
    if (currentPath.includes(tokenA)) {
      return;
    }

    // Push this token onto the end of the currentPath
    currentPath.push(tokenA);

    // If tokenA === tokenB, we have reached tokenDest and completed a path
    if (tokenA === tokenB) {
      pathList.push(cloneDeep(currentPath)); // Add the currentPath to pathList
      currentPath.pop(); // Take the current node off the path and rewind
      return;
    }

    // Recur for all the vertices adjacent to current vertex
    if (currentPath.length < MAX_PATH_LENGTH) {
      for (let i in graph[tokenA]) {
        dfs(i, tokenB);
      }
    }

    currentPath.pop(); // Take the current node off the path and rewind
  }

  function printPath(path) {
    let out = '';

    for (let i = 0; i < path.length; i++) {
      out += tokens.get(path[i]).symbol + ',';
    }

    return out;
  }
}
