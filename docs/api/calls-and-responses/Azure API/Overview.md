## API Documentation Overview

This documentation provides an overview of the API services provided by the application, detailing endpoints, functionalities, and configurations. The system utilizes `Express.js` for handling HTTP requests, `Mongoose` for database interactions, and `Web3` for interacting with Ethereum blockchain.

### Setup and Configuration

The application initializes with several important configurations:

- **Database Configuration**: Uses MongoDB, configured to connect with specific user credentials and database details provided via environment variables.
- **Server Configuration**: Sets the server's listening port and configures middleware for CORS, request compression, JSON body parsing, and security features using `lusca`.

### API Endpoints

#### Tokens

- **GET `/tokens/`**: Retrieve all token pairings.
- **GET `/tokens/:token`**: Get specific token details by token identifier.
- **GET `/secret_tokens/`**: Fetch all tokens with special properties (e.g., secret tokens).

#### Rewards

- **GET `/rewards/`**: Fetch all reward pools.
- **GET `/rewards/:pool`**: Retrieve specific reward pool details by pool identifier.

#### SecretSwap Pairs and Pools

- **GET `/secretswap_pairs/`**: List all SecretSwap pairs.
- **GET `/secretswap_pools/`**: List all SecretSwap pools.

#### Claims

- **GET `/proof/eth/:addr`**: Get Ethereum claim proofs for a specified address.
- **GET `/proof/scrt/:addr`**: Get Secret Network claim proofs for a specified address.

#### Cashback Rates

- **GET `/cashback/network_avg_rate/`**: Retrieve the average network cashback rate.
- **POST `/cashback/network_avg_rate/:rate`**: Post a new cashback burn rate.

### Ethereum Blockchain Interactions

- **GET ETH Balance**: Returns the Ethereum balance of a specified address.
- **GET ERC Balance**: Fetches the balance of a specified ERC20 token for a given address.
- **GET ERC Name**: Retrieves the name of an ERC20 token using its contract address.

### Models and Data Structures

Various Mongoose models are used to manage data storage:

- **Tokens**: Handling details about different tokens.
- **Rewards**: Storing information regarding reward pools.
- **SecretSwap Pairs and Pools**: Managing pairs and pools for SecretSwap.
- **Cashback Stats**: Tracking cashback rates and statistics.
- **Claim Proofs**: Storing proofs for claims on different blockchains.

### Utilities and Helpers

- **Cache System**: A caching mechanism to reduce database read operations.
- **Logger**: A comprehensive logging system to capture and store runtime information.
- **Configuration Management**: Uses `convict` for managing configuration settings from environment variables and config files.

### Error Handling

Error handling is robust, with catch blocks that log errors and send appropriate HTTP status codes and messages in response to issues.

### Express Server

The server is equipped with error handling middleware for development and is started on the configured port, logging its status.

---

This summary encapsulates the functionalities of the API, emphasizing the integration of blockchain technology for token management and claim verification, coupled with traditional web service practices for handling data and requests efficiently.
