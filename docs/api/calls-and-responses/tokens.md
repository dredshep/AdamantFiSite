## GET /tokens

Returns a list of all tokens

### Request Parameters

- **page**: The page number for pagination (optional, default is `0`).
- **size**: The number of items to return per page (optional, default is `1000`).

### Example Request

```ts
fetch("https://api-bridge-mainnet.azurewebsites.net/tokens/?page=0&size=1000", {
  method: "GET",
});
```

### Response Schema

```ts
export interface TokensResponse {
  tokens: Token[];
}

export interface Token {
  src_network: string;
  src_coin: string;
  src_address: string;
  dst_network: string;
  dst_address: string;
  dst_coin?: string;
  decimals: number;
  name: string;
  display_props: DisplayProps;
  totalLocked: string;
  totalLockedNormal: string;
  totalLockedUSD: string;
  price: string;
  _id: string;
}

export interface DisplayProps {
  symbol: string;
  image: string;
  min_to_scrt: string;
  min_from_scrt: string;
  label: string;
  hidden?: boolean;
  proxy?: boolean;
  usage?: string[];
}
```

### Response Example

```json
{
  "tokens": [
    {
      "src_network": "Ethereum",
      "src_coin": "Ethereum",
      "src_address": "native",
      "dst_network": "Secret",
      "dst_address": "secret1wuzzjsdhthpvuyeeyhfq2ftsn3mvwf9rxy6ykw",
      "dst_coin": "secret-Ethereum",
      "decimals": 18,
      "name": "Ethereum",
      "display_props": {
        "symbol": "ETH",
        "image": "/static/eth.png",
        "min_to_scrt": "0.001",
        "min_from_scrt": "0.1",
        "label": "Ethereum",
        "hidden": false
      },
      "totalLocked": "0",
      "totalLockedNormal": "0",
      "totalLockedUSD": "0",
      "price": "1644.8400",
      "_id": "662145431fcacc911aa84bd6"
    },
    {
      "src_network": "Ethereum",
      "src_coin": "Tether",
      "src_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "dst_network": "Secret",
      "dst_address": "secret18wpjn83dayu4meu6wnn29khfkwdxs7kyrz9c8f",
      "dst_coin": "secret-Tether",
      "decimals": 6,
      "name": "Tether",
      "display_props": {
        "symbol": "USDT",
        "image": "/static/tokens/tether-usdt-logo.svg",
        "min_to_scrt": "1",
        "min_from_scrt": "50",
        "label": "Tether"
      },
      "totalLocked": "0",
      "totalLockedNormal": "0",
      "totalLockedUSD": "0",
      "price": "1.0000",
      "_id": "662145431fcacc08dfa84bd7"
    },
    {
      "src_network": "Ethereum",
      "src_coin": "Dai Stablecoin",
      "src_address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      "dst_network": "Secret",
      "dst_address": "secret1vnjck36ld45apf8u4fedxd5zy7f5l92y3w5qwq",
      "dst_coin": "secret-Dai Stablecoin",
      "decimals": 18,
      "name": "Dai Stablecoin",
      "display_props": {
        "symbol": "DAI",
        "image": "https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png",
        "min_to_scrt": "1",
        "min_from_scrt": "100",
        "label": "Dai Stablecoin"
      },
      "totalLocked": "0",
      "totalLockedNormal": "0",
      "totalLockedUSD": "0",
      "price": "1.0010",
      "_id": "662145431fcacc3446a84bd8"
    }
  ]
}
```
