import { MsgExecuteContract, SecretNetworkClient, Wallet } from "secretjs";
import BigNumber from "bignumber.js";
import {
  Keplr,
  OfflineAminoSigner,
  OfflineDirectSigner,
  Window,
} from "@keplr-wallet/types";
import { getBestRoute } from "../../../SwapFunctions/getBestRoute";
import { getHops } from "../../../SwapFunctions/getHops";
import { executeRouterSwap } from "../../../executeRouterSwap";

// Keplr Wallet Integration
const connectKeplr = async () => {
  await (window as Window).keplr?.enable("secret-4");
  const offlineSigner = (window as Window).getOfflineSigner?.("secret-4");
  const accounts = await offlineSigner?.getAccounts();
  return {
    address: accounts?.[0].address,
    signer: offlineSigner,
  };
};

const createClient = async (
  signer: OfflineAminoSigner & OfflineDirectSigner,
) => {
  const accounts = await signer.getAccounts();
  const client = new SecretNetworkClient({
    url: "https://grpc-web.secret-4.api.trivium.network:9091",
    wallet: signer,
    walletAddress: accounts[0].address,
    chainId: "secret-4",
  });
  return client;
};

(async () => {
  const keplrConnection = await connectKeplr();
  if (!keplrConnection.signer) {
    console.error("No signer found");
    return;
  }
  const secretjs = await createClient(keplrConnection.signer);

  // Define the parameters for the swap
  const fromToken = "secret1...";
  const toToken = "secret2...";
  const fromAmount = "1000000"; // Example amount
  const expectedReturn = "990000"; // Example expected return

  const bestRouteData = getBestRoute({
    fromInput: 1,
    toInput: 1,
    cachedGasFeesUnfilledCoin: [0.12],
    isToEstimated: true,
    routes: [["a", "b"]],
    tokens: {
      a: { address: "secret1...", code_hash: "..." },
      b: { address: "secret2...", code_hash: "..." },
    },
    pairs: new Map([["a:b", { contract_addr: "secret1...", asset_infos: [] }]]),
    balances: { a: "1000000", b: "1000000" },
  });

  if (bestRouteData.bestRoute) {
    const hops = await getHops(
      bestRouteData.bestRoute,
      bestRouteData.pairs,
      secretjs,
    );

    await executeRouterSwap(
      keplrConnection.signer,
      keplrConnection.address,
      fromToken,
      fromAmount,
      hops,
      expectedReturn,
      bestRouteData.bestRoute,
    );
  } else {
    console.error("No valid route found");
  }
})();
