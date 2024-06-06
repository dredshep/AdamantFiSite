import { SecretString } from "@/types";
import { create } from "zustand";

type State = {
  config: Record<string, string | undefined>;
  isMaintenance: boolean;
  priceData: Record<string, unknown>;
  setIsMaintenance: (isMaintenance: boolean) => void;
  setPriceData: (priceData: Record<string, unknown>) => void;
};

const requiredEnvVars = [
  "AMM_ROUTER_CONTRACT",
  "AMM_FACTORY_CONTRACT",
  "ETH_GAS_LIMIT",
  "ETH_MANAGER_CONTRACT",
  "ETH_GOV_TOKEN_ADDRESS",
  "ETH_DIST_TOKEN_ADDRESS",
  "BSC_MANAGER_CONTRACT",
  "PLSM_MANAGER_CONTRACT",
  "SSCRT_CONTRACT",
  "WSCRT_PROXY_CONTRACT_ETH",
  "WSCRT_PROXY_CONTRACT_BSC",
  "SIENNA_CONTRACT",
  "SIENNA_PROXY_CONTRACT_ETH",
  "SIENNA_PROXY_CONTRACT_BSC",
  "BSC_EXPLORER_URL",
  "ETH_EXPLORER_URL",
];

function getConfig(): Record<string, SecretString | undefined> {
  // use semantic variable names
  const { config, missingVars } = requiredEnvVars.reduce(
    (acc, key) => {
      // Step 1: Get the value of the environment variable
      const value = process.env[key];

      // Step 2: Update the config object with the environment variable value
      return {
        config: { ...acc.config, [key]: value as SecretString },

        // Step 3: Check if the environment variable is missing
        missingVars: value === undefined
          ? [...acc.missingVars, key]
          : acc.missingVars,
      };
    },
    {
      config: {} as Record<string, SecretString | undefined>,
      missingVars: [] as string[],
    },
  );

  if (missingVars.length > 0) {
    const message = `Missing environment variables: ${
      missingVars.join(", ")
    }. Please check your .env.local file.`;
    throw new Error(message);
  }

  return config;
}

// Define the Zustand store using the getConfig function.
const useGlobalConfigStore = create<State>((set) => ({
  config: getConfig(),
  isMaintenance: false,
  priceData: {},
  setPriceData: (priceData: Record<string, unknown>) =>
    set(() => ({ priceData })),
  setIsMaintenance: (isMaintenance: boolean) => set(() => ({ isMaintenance })),
}));

export default useGlobalConfigStore;
