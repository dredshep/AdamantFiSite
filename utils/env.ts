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
  } as const;

  const missingVars = Object.entries(requiredVars)
    .filter((entry) => {
      const { value } = entry[1];
      return typeof value !== 'string' || value.trim() === '';
    })
    .map((entry) => {
      const { envKey, description } = entry[1];
      return `${envKey}: ${description}`;
    });

  if (missingVars.length > 0) {
    const errorMessage = [
      'Missing required Secret Network environment variables:',
      ...missingVars,
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

  // At this point, we're sure all values exist and are non-empty strings
  return {
    RPC_URL: requiredVars.RPC_URL.value as string,
    CHAIN_ID: requiredVars.CHAIN_ID.value as string,
    LCD_URL: requiredVars.LCD_URL.value as string,
    INCENTIVES_CONTRACT_ADDRESS: requiredVars.INCENTIVES_CONTRACT_ADDRESS.value as string,
    INCENTIVES_CONTRACT_HASH: requiredVars.INCENTIVES_CONTRACT_HASH.value as string,
    LOAD_BALANCE_PREFERENCE: loadBalanceValue as LoadBalancePreference,
  };
}

// example usage:
// import { getSecretNetworkEnvVars } from '@/utils/env';
// const envVars = getSecretNetworkEnvVars();
// console.log(envVars);
