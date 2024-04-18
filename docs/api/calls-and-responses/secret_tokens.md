# Secret Tokens API Endpoint on SecretSwap

The Secret Tokens API endpoint provides a comprehensive list of Secret tokens available on the SecretSwap platform. It includes information on liquidity pool tokens, their usage, and other relevant properties.

## GET /secret_tokens/

### Request Parameters

- **page**: The page number for pagination purposes. This parameter is optional, defaulting to `0`.
- **size**: Specifies the number of items to return per page. This parameter is optional and defaults to `1000`.

### Example Request

```ts
fetch(
  "https://api-bridge-mainnet.azurewebsites.net/secret_tokens/?page=0&size=1000",
  {
    method: "GET",
  }
);
```

### Response Schema

```ts
interface SecretTokensResponse {
  tokens: SecretToken[];
}

interface SecretToken {
  name: string;
  address: string;
  decimals: number;
  hidden: boolean;
  usage: string[];
  price: string;
  id: string;
  display_props: DisplayProps;
  _id: string;
}

interface DisplayProps {
  image: string;
  symbol: string;
  label: string;
}
```

### Example Response

```json
{
    "tokens": [
        {
            "name": "LP-SSCRT-SEFI",
            "address": "secret1709qy2smh0r7jjac0qxfgjsqn7zpvgthsdz025",
            "decimals": 6,
            "hidden": true,
            "usage": ["LPSTAKING"],
            "price": "0",
            "id": "lp-sscrt-sefi",
            "display_props": {
                "image": "/static/scrt.svg",
                "symbol": "lp-sscrt-sefi",
                "label": "LP-SSCRT-SEFI"
            },
            "_id": "662145391fcacc7218a84b64"
        },
        ...
    ]
}
```
