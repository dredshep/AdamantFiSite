import { Window as KeplrWindow } from "@keplr-wallet/types";
import { useState, useEffect } from "react";
import { SecretNetworkClient } from "secretjs";
import Decimal from "decimal.js";

interface PoolQueryResponse {
  assets: {
    info: {
      token: {
        contract_addr: string;
        token_code_hash: string;
        viewing_key: string;
      };
    };
    amount: string;
  }[];
  total_share: string;
}

interface PoolData {
  reserves: {
    [token: string]: { amount: Decimal; decimals: number };
  };
  fee: number;
}

const getPoolData = async (
  secretjs: SecretNetworkClient,
  poolAddress: string
): Promise<PoolData> => {
  const response = (await secretjs.query.compute.queryContract({
    contract_address: poolAddress,
    code_hash:
      "0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490",
    query: { pool: {} },
  })) as PoolQueryResponse;

  if (typeof response !== "object" || response === null) {
    throw new Error("Invalid response from pool contract");
  }

  const reserves = response.assets.reduce(
    (acc: { [key: string]: { amount: Decimal; decimals: number } }, asset) => {
      const decimals =
        asset.info.token.contract_addr ===
        "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek"
          ? 6
          : 12; // Adjust accordingly
      acc[asset.info.token.contract_addr] = {
        amount: new Decimal(asset.amount),
        decimals,
      };
      return acc;
    },
    {}
  );

  return {
    reserves,
    fee: 0.003, // Assuming a fee of 0.3%
  };
};

const calculateSwapOutput = (
  amountIn: Decimal,
  poolData: PoolData,
  inputToken: string,
  outputToken: string
): Decimal => {
  const inputReserve = poolData.reserves[inputToken];
  const outputReserve = poolData.reserves[outputToken];

  if (!inputReserve || !outputReserve) {
    throw new Error("Invalid token addresses");
  }

  const x = inputReserve.amount;
  const y = outputReserve.amount;

  const amountInAdjusted = amountIn.mul(Decimal.pow(10, inputReserve.decimals));
  const feeMultiplier = new Decimal(1000).sub(poolData.fee * 1000);
  const amountInWithFee = amountInAdjusted.mul(feeMultiplier).div(1000);

  const k = x.mul(y);
  const newX = x.add(amountInWithFee);
  const newY = k.div(newX);

  const output = y.sub(newY);

  // Ensure output does not exceed reserves
  return output.lessThanOrEqualTo(y) ? output : y;
};

const estimateSwapOutput = async (
  secretjs: SecretNetworkClient,
  poolAddress: string,
  amountIn: Decimal,
  inputToken: string,
  outputToken: string
): Promise<Decimal> => {
  const poolData = await getPoolData(secretjs, poolAddress);
  return calculateSwapOutput(amountIn, poolData, inputToken, outputToken);
};

const SwapPage = () => {
  const [amountIn, setAmountIn] = useState<string>("");
  const [estimatedOutput, setEstimatedOutput] = useState<string>("");
  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);

  useEffect(() => {
    const connectKeplr = async () => {
      if (!window.keplr) {
        alert("Please install Keplr extension");
        return;
      }

      await window.keplr.enable("secret-4");

      const offlineSigner = (window as KeplrWindow).getOfflineSigner?.(
        "secret-4"
      );
      const accounts = await offlineSigner?.getAccounts();

      if (!accounts || accounts.length === 0) {
        alert("No accounts found");
        return;
      }

      const client = new SecretNetworkClient({
        chainId: "secret-4",
        url: "https://lcd.mainnet.secretsaturn.net",
        wallet: offlineSigner,
        walletAddress: accounts[0].address,
      });

      setSecretjs(client);
    };

    connectKeplr();
  }, []);

  const handleSwap = async () => {
    if (secretjs && amountIn) {
      const poolAddress = "secret1sj65pd9fqgwyj0a9ctl4cecp62y52z5nzpq60r"; // sSCRT-sDAI
      const inputToken = "secret1vnjck36ld45apf8u4fedxd5zy7f5l92y3w5qwq"; // sUSDT
      const outputToken = "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek"; // sSCRT
      const amountInDecimal = new Decimal(amountIn);

      try {
        const output = await estimateSwapOutput(
          secretjs,
          poolAddress,
          amountInDecimal,
          inputToken,
          outputToken
        );
        setEstimatedOutput(output.toFixed(6)); // Adjust the precision as needed
      } catch (error) {
        console.error("Error estimating swap output:", error);
        setEstimatedOutput("Error estimating output");
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-900 to-indigo-900 min-h-screen flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Secret Swap Estimator
        </h1>
        <div className="flex flex-col space-y-4">
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="Amount of sDAI"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSwap}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Estimate Swap
          </button>
          <div>
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mt-8">
              Estimated Output
            </h2>
            <p className="text-2xl text-center text-gray-900 dark:text-white">
              {estimatedOutput} {estimatedOutput && "sSCRT"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapPage;
