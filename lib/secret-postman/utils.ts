import { getSecretNetworkEnvVars } from '@/utils/env';
import { getRuntimeNetworkConfig } from '@/utils/network/runtimeNetwork';
import { EncryptionUtilsImpl, SecretNetworkClient } from 'secretjs';
import { NetworkConfig, QueryRequest, QueryResponse, TemplateContext } from './types';

/**
 * Creates a SecretNetworkClient with the given network configuration
 */
export function createSecretClient(networkConfig: NetworkConfig): SecretNetworkClient {
  return new SecretNetworkClient({
    chainId: networkConfig.chainId,
    url: networkConfig.lcdUrl,
  });
}

/**
 * Creates a wallet-connected SecretNetworkClient if Keplr is available
 */
export async function createWalletSecretClient(
  networkConfig: NetworkConfig
): Promise<SecretNetworkClient | null> {
  if (typeof window === 'undefined' || !window.keplr) {
    return null;
  }

  try {
    await window.keplr.enable(networkConfig.chainId);
    const offlineSigner = window.keplr.getOfflineSignerOnlyAmino(networkConfig.chainId);
    const encryptionUtils = new EncryptionUtilsImpl(networkConfig.lcdUrl, undefined);
    const accounts = await offlineSigner.getAccounts();

    if (!accounts[0]) {
      return null;
    }

    return new SecretNetworkClient({
      chainId: networkConfig.chainId,
      url: networkConfig.lcdUrl,
      wallet: offlineSigner,
      walletAddress: accounts[0].address,
      encryptionUtils: encryptionUtils,
    });
  } catch (error) {
    console.error('Failed to create wallet client:', error);
    return null;
  }
}

/**
 * Get the latest block height from tendermint
 */
export async function getLatestBlockHeight(networkConfig: NetworkConfig): Promise<number> {
  const client = createSecretClient(networkConfig);

  try {
    const blockResponse = await client.query.tendermint.getLatestBlock({});
    const rawHeight = blockResponse.block?.header?.height;

    if (rawHeight === undefined) {
      throw new Error('Failed to get latest block height');
    }

    // Parse the height to ensure it's a number
    return typeof rawHeight === 'string' ? parseInt(rawHeight, 10) : rawHeight;
  } catch (error) {
    throw new Error(
      `Failed to fetch block height: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Execute a query against a Secret Network contract
 */
export async function executeQuery(request: QueryRequest): Promise<QueryResponse> {
  const startTime = Date.now();

  try {
    const client = createSecretClient(request.networkConfig);

    let queryMsg = request.query;
    let height: number | undefined;

    // If autoFetchHeight is enabled, get the latest block height
    if (request.autoFetchHeight) {
      height = await getLatestBlockHeight(request.networkConfig);
    } else if (request.height !== undefined) {
      // Use provided height, ensuring it's a number
      height = typeof request.height === 'string' ? parseInt(request.height, 10) : request.height;
    }

    // Build template context for variable processing
    const templateContext: TemplateContext = {};

    // Add height variables if available
    if (height !== undefined) {
      templateContext.HEIGHT = height;
      templateContext.BLOCK_HEIGHT = height;
    }

    // Get wallet address from Keplr if available
    if (typeof window !== 'undefined' && window.keplr) {
      try {
        await window.keplr.enable(request.networkConfig.chainId);
        const offlineSigner = window.keplr.getOfflineSigner(request.networkConfig.chainId);
        const accounts = await offlineSigner.getAccounts();
        if (accounts.length > 0) {
          templateContext.ADDRESS = accounts[0]?.address || '';
        }
      } catch (error) {
        console.warn('Failed to get wallet address for template variables:', error);
      }
    }

    // Get viewing key for the contract if needed
    if (typeof window !== 'undefined' && window.keplr && request.contractAddress) {
      try {
        const viewingKey = await window.keplr.getSecret20ViewingKey(
          request.networkConfig.chainId,
          request.contractAddress
        );
        if (viewingKey) {
          templateContext.VIEWING_KEY = viewingKey;
        }
      } catch (error) {
        console.warn('Failed to get viewing key for template variables:', error);
      }
    }

    // Process template variables in the query
    const queryString = JSON.stringify(queryMsg);
    const processedQueryString = processTemplateVariables(queryString, templateContext);

    try {
      queryMsg = JSON.parse(processedQueryString) as Record<string, unknown>;
    } catch (error) {
      console.warn('Failed to parse processed query, using original:', error);
    }

    // Debug logging - show the exact query being sent
    console.group('🔍 Secret Postman Query Debug');
    console.log('📋 Template Context:', templateContext);
    console.log('📝 Original Query:', request.query);
    console.log('🔄 Processed Query:', JSON.stringify(queryMsg, null, 2));
    console.log('🏠 Contract Address:', request.contractAddress);
    console.log('🔑 Code Hash:', request.codeHash || 'None provided');
    console.log('🌐 Network:', request.networkConfig.name);
    console.groupEnd();

    let result: unknown;

    if (request.codeHash) {
      // Query with code hash
      result = await client.query.compute.queryContract({
        contract_address: request.contractAddress,
        code_hash: request.codeHash,
        query: queryMsg,
      });
    } else {
      // Query without code hash (will work for some contracts)
      result = await client.query.compute.queryContract({
        contract_address: request.contractAddress,
        query: queryMsg,
      });
    }

    console.log('✅ Query Result:', result);

    const executionTime = Date.now() - startTime;

    return {
      id: generateId(),
      requestId: request.id,
      success: true,
      data: result,
      timestamp: Date.now(),
      executionTime,
      networkUsed: request.networkConfig,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    // Debug logging for errors
    console.group('❌ Secret Postman Query Error');
    console.error('Error details:', error);
    console.log('🏠 Contract Address:', request.contractAddress);
    console.log('🔑 Code Hash:', request.codeHash || 'None provided');
    console.log('🔄 Original Query:', request.query);
    console.groupEnd();

    return {
      id: generateId(),
      requestId: request.id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
      executionTime,
      networkUsed: request.networkConfig,
    };
  }
}

/**
 * Process template variables in a JSON string
 */
export function processTemplateVariables(jsonString: string, context: TemplateContext): string {
  let processed = jsonString;

  // Replace template variables like {{VARIABLE_NAME}}
  Object.entries(context).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, String(value));
  });

  return processed;
}

/**
 * Validate JSON query string
 */
export function validateJsonQuery(jsonString: string): {
  valid: boolean;
  error?: string;
  parsed?: Record<string, unknown>;
} {
  try {
    const parsed: unknown = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {
        valid: false,
        error: 'Query must be a JSON object',
      };
    }

    return {
      valid: true,
      parsed: parsed as Record<string, unknown>,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format JSON with proper indentation
 */
export function formatJson(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/**
 * Get default network configuration based on environment
 */
export function getDefaultNetworkConfig(): NetworkConfig {
  const env = getSecretNetworkEnvVars();
  const runtime = getRuntimeNetworkConfig();
  return {
    chainId: env.CHAIN_ID,
    lcdUrl: runtime.lcdUrl,
    rpcUrl: runtime.rpcUrl,
    name: env.CHAIN_ID === 'pulsar-3' ? 'Secret Testnet' : 'Secret Network',
  };
}

/**
 * Escape special characters for template variables
 */
export function escapeTemplateVariable(value: string): string {
  return value.replace(/[{}]/g, '\\$&');
}

/**
 * Extract template variables from a JSON string
 */
export function extractTemplateVariables(jsonString: string): string[] {
  const regex = /{{([^}]+)}}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(jsonString)) !== null) {
    if (match[1] && !variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}
