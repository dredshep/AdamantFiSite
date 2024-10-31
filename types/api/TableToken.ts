import { SecretString } from "../SecretString";

export type TableToken = {
  address: SecretString;
  name: string;
  // network: string;
  // price: string;
  change: string;
  tvl: string;
  volume: string;
};
