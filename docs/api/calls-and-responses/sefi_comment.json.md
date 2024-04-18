# Secret Finance Datafeed API

The Secret Finance Datafeed API provides real-time and historical data on various cryptocurrencies and their pricing information within the Secret Network. This data is crucial for developers, traders, and analysts who require up-to-date information for their operations, trading strategies, and analysis.

## GET /sefi_comment.json

### Request

```plaintext
GET https://data.secretswap.net/apps/ss/sefi_comment.json
```

### Example Request

```ts
const response = await fetch(
  "https://data.secretswap.net/apps/ss/sefi_comment.json"
);
const data = await response.json();
```

### TypeScript Interfaces

```ts
interface DatafeedResponse {
  [key: string]: CurrencyInfo;
}

interface CurrencyInfo {
  value?: number;
  price: number;
  __comment__: string;
}
```

### Example Response Component

```json
{
  "sefi_circulating": {
    "value": 605337065.775755,
    "__comment__": "Secret Finance datafeed v1.1 SEFI circulating: 2022-08-02 14:02:02 UTC"
  },
  "ALTER/USD": {
    "price": 0.10274,
    "__comment__": "Secret Finance datafeed v1.1 ALTER: 2022-08-02 14:02:02 UTC"
  }
}
```

This API endpoint offers detailed information about the circulating supply of SEFI tokens, as well as the current price of ALTER tokens against the USD, among other currencies. Each data point is timestamped with the exact date and time it was recorded, ensuring users have access to timely and accurate financial information.
