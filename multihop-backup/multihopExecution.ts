import { SecretNetworkClient } from 'secretjs';
import { MultihopPath } from './routing';

// Router contract configuration - will need to be imported from tokens config
const ROUTER = {
  contract_address: 'secret1PLACEHOLDER_ROUTER_ADDRESS_CHANGE_ME',
  code_hash: 'PLACEHOLDER_CODE_HASH_CHANGE_ME',
};

const MULTIHOP_ENABLED = false;

// Router contract message types based on the contract source
export interface RouterHop {
  from_token: RouterToken;
  pair_address: string;
  pair_code_hash: string;
}

export interface RouterToken {
  snip20?: {
    address: string;
    code_hash: string;
  };
  scrt?: Record<string, never>;
}

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
  error?: string;
  debugInfo?: Record<string, unknown>;
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
 * Execute direct swap using pair contract
 */
async function executeDirectSwap(params: MultihopSwapParams): Promise<SwapResult> {
  const hop = params.path.hops[0];
  if (!hop) {
    throw new Error('No hop found for direct swap');
  }

  console.log('🎯 MultihopExecution: Direct swap details', {
    pairContract: hop.pairContract,
    fromToken: hop.fromToken,
    toToken: hop.toToken,
  });

  // Get token info for the from token - will need to import TOKENS
  // const fromToken = TOKENS.find((t) => t.address === params.fromTokenAddress);
  // For now, use a placeholder structure
  const fromToken = {
    codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e', // Generic SNIP-20 hash
  };

  // Create swap message
  const swapMsg = {
    swap: {
      expected_return: params.minReceived,
      to: params.userAddress,
    },
  };

  console.log('📝 MultihopExecution: Direct swap message', swapMsg);

  // Execute the swap
  const tx = await params.client.tx.snip20.send(
    {
      sender: params.userAddress,
      contract_address: params.fromTokenAddress,
      code_hash: fromToken.codeHash,
      msg: {
        send: {
          recipient: hop.pairContract,
          amount: params.amount,
          msg: Buffer.from(JSON.stringify(swapMsg)).toString('base64'),
        },
      },
    },
    {
      gasLimit: 300_000,
    }
  );

  console.log('✅ MultihopExecution: Direct swap transaction submitted', {
    txHash: tx.transactionHash,
    gasUsed: tx.gasUsed,
  });

  return {
    success: true,
    txHash: tx.transactionHash,
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
  console.log('🔀 MultihopExecution: Preparing router swap');

  // Convert our path to router format
  const routerHops = convertToRouterHops(params.path);
  const routerRoute: RouterRoute = {
    hops: routerHops,
    expected_return: params.minReceived,
    to: params.userAddress,
  };

  console.log('🗺️ MultihopExecution: Router route prepared', {
    hopsCount: routerHops.length,
    route: routerRoute,
  });

  // Get token info for the from token - placeholder
  const fromToken = {
    codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
  };

  // Create the route message for the router
  const routeMsg = Buffer.from(JSON.stringify(routerRoute)).toString('base64');

  console.log('📝 MultihopExecution: Router message prepared', {
    routeBase64: routeMsg,
    routeDecoded: routerRoute,
  });

  // Send tokens to router with route instructions
  const tx = await params.client.tx.snip20.send(
    {
      sender: params.userAddress,
      contract_address: params.fromTokenAddress,
      code_hash: fromToken.codeHash,
      msg: {
        send: {
          recipient: ROUTER.contract_address,
          amount: params.amount,
          msg: routeMsg,
        },
      },
    },
    {
      gasLimit: 500_000, // Higher gas limit for multihop
    }
  );

  console.log('✅ MultihopExecution: Router swap transaction submitted', {
    txHash: tx.transactionHash,
    gasUsed: tx.gasUsed,
    routerAddress: ROUTER.contract_address,
  });

  return {
    success: true,
    txHash: tx.transactionHash,
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
    // For backup version, use placeholder values
    const pairCodeHash = '0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490';

    // Convert to router token format (check if it's native SCRT)
    const routerToken: RouterToken = hop.fromToken.includes('scrt')
      ? { scrt: {} }
      : {
          snip20: {
            address: hop.fromToken,
            code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
          },
        };

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

  console.log('🔍 MultihopExecution: Validating configuration', {
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
