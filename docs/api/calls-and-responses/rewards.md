# Rewards API Endpoint on SecretSwap

The Rewards API endpoint on SecretSwap provides detailed information about the rewards pools available on the platform. It offers insights into each pool's address, included tokens, rewards tokens, total locked amounts, pending rewards, and deadlines.

## GET /rewards/

### Request Parameters

- **page**: Specifies the page number for paginated results. This parameter is optional, with a default value of `0`.
- **size**: Determines the number of items to be returned per page. This parameter is optional and defaults to `1000`.

### Example Request

```ts
fetch(
  "https://api-bridge-mainnet.azurewebsites.net/rewards/?page=0&size=1000",
  {
    method: "GET",
  }
);
```

### Response Schema

```ts
interface RewardsResponse {
  pools: Pool[];
}

interface Pool {
  pool_address: string;
  inc_token: Token;
  rewards_token: Token;
  total_locked: string;
  pending_rewards: string;
  deadline: string;
  hidden?: boolean;
  deprecated?: boolean;
  deprecated_by?: string;
  _id: string;
}

interface Token {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
  price: number;
}
```

### Example Response

```json
{
    "pools": [
        {
            "pool_address": "secret1q6y7wz6pev80aadyjsejk5xr2yj4mkrj40zrvn",
            "inc_token": {
                "symbol": "sETH",
                "address": "secret1wuzzjsdhthpvuyeeyhfq2ftsn3mvwf9rxy6ykw",
                "decimals": 18,
                "name": "ethereum",
                "price": 3370.58
            },
            "rewards_token": {
                "symbol": "sSCRT",
                "address": "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek",
                "decimals": 6,
                "name": "secret",
                "price": 0.602639
            },
            "total_locked": "185284664000000013397",
            "pending_rewards": "15022063069",
            "deadline": "425000",
            "_id": "662145431fcacc1144a84b86"
        },
        ...
    ]
}
```
