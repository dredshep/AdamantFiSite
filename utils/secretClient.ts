import { SecretNetworkClient } from "secretjs";

export const secretClient = new SecretNetworkClient({
  chainId: "secret-4",
  url: "https://rpc.ankr.com/http/scrt_cosmos",
});
