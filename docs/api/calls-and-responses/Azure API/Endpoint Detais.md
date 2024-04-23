Below is the documentation for each API endpoint, detailing the path parameters and query parameters where applicable. This documentation outlines how to interact with each specific endpoint, providing clarity on what parameters are expected and how they affect the request.

### Tokens

#### 1. Get All Token Pairings

- **Path**: `/tokens/`
- **Method**: GET
- **Description**: Retrieves a list of all token pairings.

#### 2. Get Specific Token Details

- **Path**: `/tokens/:token`
- **Method**: GET
- **Description**: Fetches details for a specific token.
- **Path Parameters**:
  - `:token` - Token identifier (`scrt_coin`) used to retrieve detailed information about a specific token.

### Secret Tokens

#### 1. Get All Secret Tokens

- **Path**: `/secret_tokens/`
- **Method**: GET
- **Description**: Retrieves all tokens that have special properties, such as secret tokens.

### Rewards

#### 1. Get All Reward Pools

- **Path**: `/rewards/`
- **Method**: GET
- **Description**: Fetches information about all reward pools.

#### 2. Get Specific Reward Pool Details

- **Path**: `/rewards/:pool`
- **Method**: GET
- **Description**: Retrieves detailed information about a specific reward pool.
- **Path Parameters**:
  - `:pool` - The identifier (`pool_address`) for the reward pool to fetch details.

### SecretSwap

#### 1. Get All SecretSwap Pairs

- **Path**: `/secretswap_pairs/`
- **Method**: GET
- **Description**: Lists all SecretSwap pairs.

#### 2. Get All SecretSwap Pools

- **Path**: `/secretswap_pools/`
- **Method**: GET
- **Description**: Lists all SecretSwap pools.

### Claims

#### 1. Get Ethereum Claim Proof

- **Path**: `/proof/eth/:addr`
- **Method**: GET
- **Description**: Retrieves Ethereum claim proofs for a specified address.
- **Path Parameters**:
  - `:addr` - Ethereum address to retrieve claim proofs for.

#### 2. Get Secret Network Claim Proof

- **Path**: `/proof/scrt/:addr`
- **Method**: GET
- **Description**: Retrieves Secret Network claim proofs for a specified address.
- **Path Parameters**:
  - `:addr` - Secret Network address (encoded) to retrieve claim proofs for.

### Cashback Rates

#### 1. Get Average Network Cashback Rate

- **Path**: `/cashback/network_avg_rate/`
- **Method**: GET
- **Description**: Retrieves the average network cashback rate.

#### 2. Post New Cashback Burn Rate

- **Path**: `/cashback/network_avg_rate/:rate`
- **Method**: POST
- **Description**: Submits a new cashback burn rate.
- **Path Parameters**:
  - `:rate` - The new cashback rate to be set.

Each of these endpoints serves a specific purpose within the application, allowing clients to interact effectively with the backend services. The path and query parameters are clearly defined to facilitate proper request formatting and execution.
