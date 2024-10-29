import { readFileSync } from "fs";

const azureTokens = readFileSync("azure_tokens.json", "utf8");
// const secretTokens = readFileSync("secret_tokens.json", "utf8");
const coinList = readFileSync("coinList.json", "utf8");

type AzureTokensJson = {
  tokens: AzureToken[];
};
// type SecretTokensJson = {
//   tokens: SecretToken[];
// };
type CoinListJson = {
  coins: Coin[];
};

const azureTokensJson = JSON.parse(azureTokens) as AzureTokensJson;
// const secretTokensJson = JSON.parse(secretTokens) as SecretTokensJson;
const coinListJson = JSON.parse(coinList) as CoinListJson;

// azureToken names are .tokens.map(token => token.name, token.src_coin and token.display_props.label; the symbol is token.symbol
// secretToken names are .tokens.map(token => token.name, symbol is token.display_props.symbol
// coinList has .map(coin => coin.name, coin.symbol and coin.id

type AzureToken = {
  name: string;
  src_coin: string;
  display_props: {
    label: string;
  };
  symbol: string;
};
// type SecretToken = {
//   name: string;
//   display_props: {
//     symbol: string;
//   };
// };

type Coin = {
  name: string;
  symbol: string;
  id: string;
};

// const azureTokenNames = azureTokensJson.tokens.map(
//   (token: AzureToken) => token.name
// );
// const azureTokenSymbols = azureTokensJson.tokens.map(
//   (token: AzureToken) => token.symbol
// );
// const azureTokenLabels = azureTokensJson.tokens.map(
//   (token: AzureToken) => token.display_props.label
// );
// const coinNames = coinListJson.map((coin: Coin) => coin.name);
// const coinSymbols = coinListJson.map((coin: Coin) => coin.symbol);
// const coinIds = coinListJson.map((coin: Coin) => coin.id);

/*
Task: Create a function that takes in a list of Azure tokens and returns a list of all the tokens that have a matching symbol, label or name in the CoinGecko coin list. The function should return an array of objects with the following structure: { azureToken: AzureToken, matchedCoin: Coin }. If there is no match, the matchedCoin property should be null. The function should also handle cases where the Azure token name or symbol does not match any coin in the CoinGecko coin list. Afterwards, log the result of the function to the console.
*/

export function matchAzureTokensWithCoinGecko(
  azureTokens: AzureToken[],
  coinList: Coin[]
) {
  return azureTokens.map((azureToken) => {
    const matchedCoin = coinList.find(
      (coin) =>
        coin.name === azureToken.name ||
        coin.symbol === azureToken.symbol ||
        coin.symbol === azureToken.display_props.label
    );
    return {
      azureToken,
      matchedCoin,
    };
  });
}

const matchedTokens = matchAzureTokensWithCoinGecko(
  azureTokensJson.tokens,
  coinListJson.coins
);

console.log(matchedTokens.map((token) => token.matchedCoin));
// log matched amount & unmatched amount
console.log(
  `Matched: ${matchedTokens.filter((token) => token.matchedCoin).length}`
);
console.log(
  `Unmatched: ${matchedTokens.filter((token) => !token.matchedCoin).length}`
);
// log a map of src_coin (from azureToken) and id (from coingecko coin) for matched tokens. This will later on help us to create a mapping between the two and fetch the price data for the matched tokens.

console.log(
  matchedTokens
    .filter((token) => token.matchedCoin)
    .map((token) => ({
      src_coin: token.azureToken.src_coin,
      id: token.matchedCoin!.id,
    }))
);
