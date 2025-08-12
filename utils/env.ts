export enum LoadBalancePreference {
  None = 'None',
  All = 'All',
  Pair = 'Pair',
}

interface SecretNetworkEnvVars {
  RPC_URL: string;
  CHAIN_ID: string;
  LCD_URL: string;
  INCENTIVES_CONTRACT_ADDRESS: string;
  INCENTIVES_CONTRACT_HASH: string;
  LOAD_BALANCE_PREFERENCE: LoadBalancePreference;
  ENABLE_PRICING: boolean;
  COINGECKO_API_KEY?: string;
  COINGECKO_API_URL?: string;
  COINGECKO_AUTH_HEADER?: string;
}

export class EnvVarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvVarError';
  }
}

export function getSecretNetworkEnvVars(): SecretNetworkEnvVars {
  const requiredVars = {
    RPC_URL: {
      envKey: 'NEXT_PUBLIC_RPC_URL',
      value: process.env['NEXT_PUBLIC_RPC_URL'],
      description: 'RPC URL for Secret Network connection',
    },
    CHAIN_ID: {
      envKey: 'NEXT_PUBLIC_CHAIN_ID',
      value: process.env['NEXT_PUBLIC_CHAIN_ID'],
      description: 'Chain ID for Secret Network (e.g. secret-4, pulsar-3)',
    },
    LCD_URL: {
      envKey: 'NEXT_PUBLIC_LCD_URL',
      value: process.env['NEXT_PUBLIC_LCD_URL'],
      description: 'LCD URL for Secret Network connection',
    },
    INCENTIVES_CONTRACT_ADDRESS: {
      envKey: 'NEXT_PUBLIC_INCENTIVES_CONTRACT_ADDRESS',
      value: process.env['NEXT_PUBLIC_INCENTIVES_CONTRACT_ADDRESS'],
      description: 'Incentives contract address for LP staking',
    },
    INCENTIVES_CONTRACT_HASH: {
      envKey: 'NEXT_PUBLIC_INCENTIVES_CONTRACT_HASH',
      value: process.env['NEXT_PUBLIC_INCENTIVES_CONTRACT_HASH'],
      description: 'Incentives contract hash for LP staking',
    },
    LOAD_BALANCE_PREFERENCE: {
      envKey: 'NEXT_PUBLIC_LOAD_BALANCE_PREFERENCE',
      value: process.env['NEXT_PUBLIC_LOAD_BALANCE_PREFERENCE'],
      description: 'Load balance preference (None, All, or Pair)',
    },
    ENABLE_PRICING: {
      envKey: 'NEXT_PUBLIC_ENABLE_PRICING',
      value: process.env['NEXT_PUBLIC_ENABLE_PRICING'],
      description: 'Enable pricing features (true/false) - defaults to false',
    },
  } as const;

  // Check for missing core variables (excluding optional pricing ones)
  const coreVars = Object.entries(requiredVars)
    .filter(([key]) => key !== 'ENABLE_PRICING') // ENABLE_PRICING can be missing (defaults to false)
    .filter((entry) => {
      const { value } = entry[1];
      return typeof value !== 'string' || value.trim() === '';
    })
    .map((entry) => {
      const { envKey, description } = entry[1];
      return `${envKey}: ${description}`;
    });

  if (coreVars.length > 0) {
    const errorMessage = [
      'Missing required Secret Network environment variables:',
      ...coreVars,
      '\nPlease check your .env.local file and ensure all required variables are set.',
    ].join('\n');

    throw new EnvVarError(errorMessage);
  }

  // Validate LOAD_BALANCE_PREFERENCE enum value
  const loadBalanceValue = requiredVars.LOAD_BALANCE_PREFERENCE.value as string;
  if (!Object.values(LoadBalancePreference).includes(loadBalanceValue as LoadBalancePreference)) {
    throw new EnvVarError(
      `Invalid NEXT_PUBLIC_LOAD_BALANCE_PREFERENCE value: "${loadBalanceValue}". Must be one of: ${Object.values(
        LoadBalancePreference
      ).join(', ')}`
    );
  }

  // Parse pricing feature flag - defaults to false if not set
  const enablePricing = requiredVars.ENABLE_PRICING.value?.toLowerCase() === 'true';

  // Only validate pricing environment variables on the server side (API routes)
  // Client-side code doesn't need CoinGecko env vars, they're handled by API routes
  if (enablePricing && typeof window === 'undefined') {
    const pricingVars = [
      { key: 'COINGECKO_API_KEY', env: 'COINGECKO_API_KEY' },
      { key: 'COINGECKO_API_URL', env: 'COINGECKO_API_URL' },
      { key: 'COINGECKO_AUTH_HEADER', env: 'COINGECKO_AUTH_HEADER' },
    ];

    const missingPricingVars = pricingVars.filter(({ env }) => {
      const value = process.env[env];
      return !value || value.trim() === '';
    });

    if (missingPricingVars.length > 0) {
      const errorMessage = [
        'Pricing is enabled but missing required CoinGecko environment variables:',
        ...missingPricingVars.map(({ env }) => `${env}: Required for CoinGecko API access`),
        '\nSet NEXT_PUBLIC_ENABLE_PRICING=false to disable pricing, or add the missing variables.',
      ].join('\n');

      throw new EnvVarError(errorMessage);
    }
  }

  // At this point, we're sure all values exist and are valid
  const result: SecretNetworkEnvVars = {
    RPC_URL: requiredVars.RPC_URL.value as string,
    CHAIN_ID: requiredVars.CHAIN_ID.value as string,
    LCD_URL: requiredVars.LCD_URL.value as string,
    INCENTIVES_CONTRACT_ADDRESS: requiredVars.INCENTIVES_CONTRACT_ADDRESS.value as string,
    INCENTIVES_CONTRACT_HASH: requiredVars.INCENTIVES_CONTRACT_HASH.value as string,
    LOAD_BALANCE_PREFERENCE: loadBalanceValue as LoadBalancePreference,
    ENABLE_PRICING: enablePricing,
  };

  // Only include CoinGecko properties when pricing is enabled
  if (enablePricing && typeof window === 'undefined') {
    result.COINGECKO_API_KEY = process.env.COINGECKO_API_KEY as string;
    result.COINGECKO_API_URL = process.env.COINGECKO_API_URL as string;
    result.COINGECKO_AUTH_HEADER = process.env.COINGECKO_AUTH_HEADER as string;
  }

  return result;
}

// example usage:
// import { getSecretNetworkEnvVars } from '@/utils/env';
// const envVars = getSecretNetworkEnvVars();
// console.log(envVars);
