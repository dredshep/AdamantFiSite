import { SecretNetworkClient } from "secretjs";

export const secretClient = new SecretNetworkClient({
  chainId: "secret-4",
  url: "https://api.secrettestnet.io",
});
