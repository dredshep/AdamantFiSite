import { DIRECT_SWAP_FEE, MULTIHOP_SWAP_FEE_PER_HOP } from '@/config/fees';
import { LIQUIDITY_PAIRS, MULTIHOP_ENABLED, ROUTER, TOKENS } from '@/config/tokens';
import Decimal from 'decimal.js';
import { SecretNetworkClient, TxResponse } from 'secretjs';
import { MultihopPath } from './routing';

// Router contract message types based on the contract source
export interface RouterHop {
  from_token: RouterToken;
  pair_address: string;
  pair_code_hash: string;
}

export type RouterToken =
  | {
      snip20: {
        address: string;
        code_hash: string;
      };
    }
  | {
      scrt: Record<string, never>;
    };

export interface RouterRoute {
  hops: RouterHop[];
  expected_return?: string;
  to: string;
}

export interface MultihopSwapParams {
  client: SecretNetworkClient;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  minReceived: string;
  path: MultihopPath;
  userAddress: string;
}

export interface SwapResult {
  success: boolean;
  txHash?: string;
  txResponse?: TxResponse;
  error?: string;
  debugInfo?: unknown;
}

/**
 * Checks if a SecretJS transaction was successful.
 * A transaction is successful if its code is 0.
 */
function txSucceeded(tx: TxResponse): boolean {
  return Number(tx.code) === 0;
}

/**
 * Converts a human-readable token amount to its base unit representation.
 * @param humanAmount The amount in human-readable format (e.g., "0.01").
 * @param decimals The number of decimals for the token.
 * @returns The amount in base units as an integer string (e.g., "10000").
 */
function toBaseUnits(humanAmount: string, decimals: number): string {
  if (!humanAmount || isNaN(Number(humanAmount))) {
    return '0';
  }
  return new Decimal(humanAmount).mul(Decimal.pow(10, decimals)).floor().toFixed();
}

/**
 * Main multihop swap execution function
 * Uses router contract for atomic multihop swaps when enabled
 * Falls back to direct swap for single-hop routes
 */
export async function executeMultihopSwap(params: MultihopSwapParams): Promise<SwapResult> {
  console.log('🚀 MultihopExecution: Starting swap execution', {
    enabled: MULTIHOP_ENABLED,
    path: params.path,
    amount: params.amount,
    minReceived: params.minReceived,
  });

  // Safety check: Ensure multihop is enabled
  if (!MULTIHOP_ENABLED) {
    console.error('❌ MultihopExecution: Multihop functionality is disabled');
    return {
      success: false,
      error: 'Multihop functionality is currently disabled for safety',
      debugInfo: { multihopEnabled: MULTIHOP_ENABLED },
    };
  }

  // Validate router configuration
  if (ROUTER.contract_address.includes('PLACEHOLDER') || ROUTER.code_hash.includes('PLACEHOLDER')) {
    console.error('❌ MultihopExecution: Router contract not properly configured', {
      routerAddress: ROUTER.contract_address,
      routerCodeHash: ROUTER.code_hash,
    });
    return {
      success: false,
      error: 'Router contract not properly configured',
      debugInfo: { router: ROUTER },
    };
  }

  try {
    // For direct swaps, use the pair contract directly
    if (params.path.isDirectPath && params.path.hops.length === 1) {
      console.log('📍 MultihopExecution: Executing direct swap via pair contract');
      return await executeDirectSwap(params);
    }

    // For multihop swaps, use the router contract
    console.log('🔀 MultihopExecution: Executing multihop swap via router contract');
    return await executeRouterSwap(params);
  } catch (error) {
    console.error('💥 MultihopExecution: Swap execution failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      debugInfo: { error, params },
    };
  }
}

/**
 * Get token info by address from our configuration
 */
function getTokenByAddress(address: string) {
  return TOKENS.find((token) => token.address === address);
}

/**
 * Get pair code hash by pair contract address
 */
function getPairCodeHash(pairContract: string): string {
  const pair = LIQUIDITY_PAIRS.find((p) => p.pairContract === pairContract);
  if (!pair) {
    throw new Error(`Pair not found for contract: ${pairContract}`);
  }
  return pair.pairContractCodeHash;
}

/**
 * Execute direct swap using pair contract
 */
async function executeDirectSwap(params: MultihopSwapParams): Promise<SwapResult> {
  const hop = params.path.hops[0];
  if (!hop) {
    throw new Error('No hop found for direct swap');
  }

  // Get token info from our configuration
  const fromToken = getTokenByAddress(params.fromTokenAddress);
  const toToken = getTokenByAddress(params.toTokenAddress);
  if (!fromToken || !toToken) {
    throw new Error(
      `Token not found in configuration: ${
        !fromToken ? params.fromTokenAddress : params.toTokenAddress
      }`
    );
  }

  console.log('🎯 MultihopExecution: Direct swap details', {
    pairContract: hop.pairContract,
    fromToken: hop.fromToken,
    toToken: hop.toToken,
    amount: params.amount,
    minReceived: params.minReceived,
    fromDecimals: fromToken.decimals,
    toDecimals: toToken.decimals,
  });

  // Convert amounts to base units
  const amountInBaseUnits = toBaseUnits(params.amount, fromToken.decimals);
  const minReceivedInBaseUnits = toBaseUnits(params.minReceived, toToken.decimals);

  // Create swap message
  const swapMsg = {
    swap: {
      expected_return: minReceivedInBaseUnits,
      to: params.userAddress,
    },
  };

  console.log('📝 MultihopExecution: Direct swap message', {
    swapMsg,
    amountInBaseUnits,
  });

  // Execute the swap
  const tx = await params.client.tx.snip20.send(
    {
      sender: params.userAddress,
      contract_address: params.fromTokenAddress,
      code_hash: fromToken.codeHash,
      msg: {
        send: {
          recipient: hop.pairContract,
          amount: amountInBaseUnits,
          msg: Buffer.from(JSON.stringify(swapMsg)).toString('base64'),
        },
      },
    },
    {
      gasLimit: Math.floor(DIRECT_SWAP_FEE * 1_000_000), // Convert SCRT to uscrt (gas units)
    }
  );

  console.log('✅ MultihopExecution: Direct swap transaction submitted', {
    txHash: tx.transactionHash,
    gasUsed: tx.gasUsed,
    code: tx.code,
    rawLog: tx.rawLog,
  });

  const success = txSucceeded(tx);
  return {
    success,
    txHash: tx.transactionHash,
    txResponse: tx,
    ...(success ? {} : { error: tx.rawLog }),
    debugInfo: {
      type: 'direct',
      gasUsed: tx.gasUsed,
      swapMsg,
    },
  };
}

/**
 * Execute multihop swap using router contract
 */
async function executeRouterSwap(params: MultihopSwapParams): Promise<SwapResult> {
  // Get token info from our configuration
  const fromToken = getTokenByAddress(params.fromTokenAddress);
  const toToken = getTokenByAddress(params.toTokenAddress);
  if (!fromToken || !toToken) {
    throw new Error(
      `Token not found in configuration: ${
        !fromToken ? params.fromTokenAddress : params.toTokenAddress
      }`
    );
  }

  console.log('🔀 MultihopExecution: Preparing router swap', {
    amount: params.amount,
    minReceived: params.minReceived,
    fromDecimals: fromToken.decimals,
    toDecimals: toToken.decimals,
  });

  // Convert amounts to base units
  const amountInBaseUnits = toBaseUnits(params.amount, fromToken.decimals);
  const minReceivedInBaseUnits = toBaseUnits(params.minReceived, toToken.decimals);

  // Convert our path to router format
  const routerHops = convertToRouterHops(params.path);
  const routerRoute: RouterRoute = {
    hops: routerHops,
    expected_return: minReceivedInBaseUnits,
    to: params.userAddress,
  };

  console.log('🗺️ MultihopExecution: Router route prepared', {
    hopsCount: routerHops.length,
    route: routerRoute,
  });

  // Create the route message for the router
  const routeMsg = Buffer.from(JSON.stringify(routerRoute)).toString('base64');

  console.log('📝 MultihopExecution: Router message prepared', {
    routeBase64: routeMsg,
    routeDecoded: routerRoute,
    amountInBaseUnits,
  });

  // Send tokens to router with route instructions
  // Calculate gas limit based on configured fees: base direct swap + per-hop fees
  const baseGasLimit = Math.floor(DIRECT_SWAP_FEE * 1_000_000); // Convert SCRT to uscrt
  const perHopGasLimit = Math.floor(MULTIHOP_SWAP_FEE_PER_HOP * 1_000_000); // Convert SCRT to uscrt
  const estimatedGasLimit = Math.min(1_200_000, baseGasLimit + routerHops.length * perHopGasLimit); // Cap at 1.2M

  const tx = await params.client.tx.snip20.send(
    {
      sender: params.userAddress,
      contract_address: params.fromTokenAddress,
      code_hash: fromToken.codeHash,
      msg: {
        send: {
          recipient: ROUTER.contract_address,
          amount: amountInBaseUnits,
          msg: routeMsg,
        },
      },
    },
    {
      gasLimit: estimatedGasLimit, // Dynamic gas limit for multihop swaps
    }
  );

  console.log('✅ MultihopExecution: Router swap transaction submitted', {
    txHash: tx.transactionHash,
    gasUsed: tx.gasUsed,
    routerAddress: ROUTER.contract_address,
    code: tx.code,
    rawLog: tx.rawLog,
    gasLimitProvided: estimatedGasLimit,
  });

  const success = txSucceeded(tx);
  return {
    success,
    txHash: tx.transactionHash,
    txResponse: tx,
    ...(success ? {} : { error: tx.rawLog }),
    debugInfo: {
      type: 'multihop',
      gasUsed: tx.gasUsed,
      routerRoute,
      routerAddress: ROUTER.contract_address,
    },
  };
}

/**
 * Convert our path format to router contract hop format
 */
function convertToRouterHops(path: MultihopPath): RouterHop[] {
  console.log('🔄 MultihopExecution: Converting path to router hops', path.hops);

  return path.hops.map((hop, index) => {
    // Get pair code hash from our configuration
    const pairCodeHash = getPairCodeHash(hop.pairContract);

    // Convert to router token format (check if it's native SCRT)
    const routerToken: RouterToken = hop.fromToken.includes('scrt')
      ? { scrt: {} }
      : (() => {
          const token = getTokenByAddress(hop.fromToken);
          if (!token) {
            throw new Error(`Token not found in configuration: ${hop.fromToken}`);
          }
          return {
            snip20: {
              address: hop.fromToken,
              code_hash: token.codeHash,
            },
          };
        })();

    const routerHop: RouterHop = {
      from_token: routerToken,
      pair_address: hop.pairContract,
      pair_code_hash: pairCodeHash,
    };

    console.log(`🔗 MultihopExecution: Hop ${index + 1} converted`, {
      original: hop,
      converted: routerHop,
    });

    return routerHop;
  });
}

/**
 * Validate that multihop can be safely used
 */
export function validateMultihopConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  console.log('�� MultihopExecution: Validating configuration', {
    enabled: MULTIHOP_ENABLED,
    router: ROUTER,
  });

  if (!MULTIHOP_ENABLED) {
    errors.push('Multihop functionality is disabled');
  }

  if (ROUTER.contract_address.includes('PLACEHOLDER')) {
    errors.push('Router contract address is not configured');
  }

  if (ROUTER.code_hash.includes('PLACEHOLDER')) {
    errors.push('Router contract code hash is not configured');
  }

  const valid = errors.length === 0;

  console.log('✅ MultihopExecution: Configuration validation complete', {
    valid,
    errors,
  });

  return { valid, errors };
}
