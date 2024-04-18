# SecretSwap Configuration API

The SecretSwap Configuration API offers a detailed overview of various contract settings within the Secret Network ecosystem. It's designed to aid developers and users by providing essential information related to token contracts, staking contracts, and pool contracts on SecretSwap.

## GET /config_mainnet.json

### Request

```plaintext
GET https://data.secretswap.net/apps/ss/config_mainnet.json
```

### TypeScript Interfaces

```ts
interface ConfigResponse {
  shadeTokenContract: TokenContract;
  alterTokenContract: TokenContract;
  alterStakingContract: StakingContract;
  infinityPoolContract: PoolContract;
  showAlterAPR: boolean;
}

interface TokenContract {
  contract_hash: string;
  src_network: string;
  src_coin: string;
  src_address: string;
  dst_network: string;
  dst_address: string;
  dst_coin: string;
  decimals: string;
  name: string;
  symbol: string;
  display_props: DisplayProps;
  totalLocked: string;
  totalLockedNormal: string;
  totalLockedUSD: string;
  price: string;
}

interface StakingContract {
  pool_address: string;
  contract_hash: string;
  inc_token: TokenInfo;
  rewards_token: TokenInfo;
  total_locked: string;
  pending_rewards: string;
  deadline: string;
  hidden: boolean;
  _id: string;
}

interface PoolContract {
  pool_address: string;
  contract_hash: string;
  inc_token: TokenInfo;
  rewards_token: TokenInfo;
  total_locked: string;
  hidden: boolean;
  pending_rewards: string;
  deadline: string;
  _id: string;
}

interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
  price: string;
}

interface DisplayProps {
  symbol: string;
  image: string;
  min_to_scrt: string;
  min_from_scrt: string;
  label: string;
  hidden: boolean;
  usage: string[];
}
```

### Example Response Component

```json
{
  "shadeTokenContract": {
    "contract_hash": "FA824C4504F21FC59250DA0CDF549DD392FD862BAF2689D246A07B9E941F04A9",
    "src_network": "Secret",
    "src_coin": "SHADE",
    "src_address": "secret1qfql357amn448duf5gvp9gr48sxx9tsnhupu3d",
    "dst_network": "Secret",
    "dst_address": "secret1qfql357amn448duf5gvp9gr48sxx9tsnhupu3d",
    "dst_coin": "SHADE",
    "decimals": "6",
    "name": "SHADE",
    "symbol": "SHADE",
    "display_props": {
      "symbol": "SHADE",
      "image": "/static/tokens/shade.svg",
      "min_to_scrt": "10",
      "min_from_scrt": "1000",
      "label": "SHADE",
      "hidden": false,
      "usage": ["LPSTAKING", "REWARDS", "SWAP"]
    },
    "totalLocked": "100000000000",
    "price": "1.0"
  }
}
```

This configuration response provides an extensive outline of the contracts available for interaction within the SecretSwap environment, assisting in the development of applications and facilitating user engagement with various tokens and pools.
