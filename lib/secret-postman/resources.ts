import { POOL_FEE, SCRT_TX_FEE, STAKING_TX_FEE } from '@/config/fees';
import { REWARD_CONTRACTS, STAKING_POOLS } from '@/config/staking';
import { FACTORY, LIQUIDITY_PAIRS, STAKING_CONTRACTS, TOKENS } from '@/config/tokens';
import { ResourceItem } from './types';

/**
 * Generate resource items from configuration files
 */
export function getDefaultResources(): ResourceItem[] {
  const resources: ResourceItem[] = [];

  // Tokens
  TOKENS.forEach((token) => {
    resources.push({
      id: `token-${token.symbol}`,
      category: 'tokens',
      name: `${token.name} (${token.symbol})`,
      description: `Address: ${token.address}`,
      value: token.address,
      templateVariable: `${token.symbol.toUpperCase()}_ADDRESS`,
      metadata: {
        symbol: token.symbol,
        codeHash: token.codeHash,
        decimals: token.decimals,
        isStablecoin: token.isStablecoin,
      },
    });

    resources.push({
      id: `token-hash-${token.symbol}`,
      category: 'tokens',
      name: `${token.symbol} Code Hash`,
      description: `Code hash for ${token.name}`,
      value: token.codeHash,
      templateVariable: `${token.symbol.toUpperCase()}_CODE_HASH`,
      metadata: {
        symbol: token.symbol,
        type: 'codeHash',
      },
    });
  });

  // Liquidity Pairs
  LIQUIDITY_PAIRS.forEach((pair) => {
    resources.push({
      id: `pair-${pair.symbol}`,
      category: 'pairs',
      name: `${pair.symbol} Pair Contract`,
      description: `Pair contract for ${pair.symbol}`,
      value: pair.pairContract,
      templateVariable: `${pair.symbol.replace('/', '_').toUpperCase()}_PAIR_ADDRESS`,
      metadata: {
        symbol: pair.symbol,
        token0: pair.token0,
        token1: pair.token1,
        codeHash: pair.pairContractCodeHash,
      },
    });

    resources.push({
      id: `lp-${pair.symbol}`,
      category: 'pairs',
      name: `${pair.symbol} LP Token`,
      description: `LP token for ${pair.symbol}`,
      value: pair.lpToken,
      templateVariable: `${pair.symbol.replace('/', '_').toUpperCase()}_LP_ADDRESS`,
      metadata: {
        symbol: pair.symbol,
        codeHash: pair.lpTokenCodeHash,
        type: 'lpToken',
      },
    });

    resources.push({
      id: `pair-hash-${pair.symbol}`,
      category: 'pairs',
      name: `${pair.symbol} Pair Code Hash`,
      description: `Code hash for ${pair.symbol} pair contract`,
      value: pair.pairContractCodeHash,
      templateVariable: `${pair.symbol.replace('/', '_').toUpperCase()}_PAIR_CODE_HASH`,
      metadata: {
        symbol: pair.symbol,
        type: 'codeHash',
      },
    });
  });

  // Staking Contracts (Legacy)
  STAKING_CONTRACTS.forEach((staking) => {
    resources.push({
      id: `staking-${staking.pairSymbol}`,
      category: 'staking',
      name: `${staking.pairSymbol} Staking Contract`,
      description: `Staking contract for ${staking.pairSymbol}`,
      value: staking.stakingContract,
      templateVariable: `${staking.pairSymbol.replace('/', '_').toUpperCase()}_STAKING_ADDRESS`,
      metadata: {
        pairSymbol: staking.pairSymbol,
        codeHash: staking.codeHash,
        rewardToken: staking.rewardTokenSymbol,
        codeId: staking.codeId,
      },
    });
  });

  // Staking Pools (New)
  STAKING_POOLS.forEach((pool) => {
    resources.push({
      id: `staking-pool-${pool.poolId}`,
      category: 'staking',
      name: `${pool.displayName} Staking`,
      description: `Staking contract for ${pool.poolId}`,
      value: pool.stakingAddress,
      templateVariable: `${pool.poolId.replace('/', '_').toUpperCase()}_STAKING_ADDRESS`,
      metadata: {
        poolId: pool.poolId,
        codeHash: pool.stakingCodeHash,
        rewardToken: pool.rewardTokenSymbol,
        isActive: pool.isActive,
        lpTokenAddress: pool.lpTokenAddress,
      },
    });

    resources.push({
      id: `staking-pool-hash-${pool.poolId}`,
      category: 'staking',
      name: `${pool.displayName} Staking Code Hash`,
      description: `Code hash for ${pool.poolId} staking contract`,
      value: pool.stakingCodeHash,
      templateVariable: `${pool.poolId.replace('/', '_').toUpperCase()}_STAKING_CODE_HASH`,
      metadata: {
        poolId: pool.poolId,
        type: 'codeHash',
      },
    });
  });

  // Reward Contracts
  Object.entries(REWARD_CONTRACTS).forEach(([key, address]) => {
    resources.push({
      id: `reward-${key}`,
      category: 'contracts',
      name: `${key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`,
      description: `Reward distribution contract: ${key}`,
      value: address,
      templateVariable: `${key.toUpperCase()}_ADDRESS`,
      metadata: {
        type: 'rewardContract',
        key,
      },
    });
  });

  // Factory Contract
  resources.push({
    id: 'factory',
    category: 'contracts',
    name: 'SecretSwap Factory',
    description: 'Main factory contract for SecretSwap',
    value: FACTORY.contract_address,
    templateVariable: 'FACTORY_ADDRESS',
    metadata: {
      codeHash: FACTORY.code_hash,
      type: 'factory',
    },
  });

  resources.push({
    id: 'factory-hash',
    category: 'contracts',
    name: 'SecretSwap Factory Code Hash',
    description: 'Code hash for SecretSwap factory',
    value: FACTORY.code_hash,
    templateVariable: 'FACTORY_CODE_HASH',
    metadata: {
      type: 'codeHash',
    },
  });

  // Fees
  resources.push({
    id: 'pool-fee-nom',
    category: 'fees',
    name: 'Pool Fee Numerator',
    description: 'Pool fee numerator (0.3% = 3/1000)',
    value: POOL_FEE.commission_rate_nom,
    templateVariable: 'POOL_FEE_NOM',
    metadata: {
      type: 'fee',
      description: 'Numerator for pool fee calculation',
    },
  });

  resources.push({
    id: 'pool-fee-denom',
    category: 'fees',
    name: 'Pool Fee Denominator',
    description: 'Pool fee denominator (0.3% = 3/1000)',
    value: POOL_FEE.commission_rate_denom,
    templateVariable: 'POOL_FEE_DENOM',
    metadata: {
      type: 'fee',
      description: 'Denominator for pool fee calculation',
    },
  });

  resources.push({
    id: 'scrt-tx-fee',
    category: 'fees',
    name: 'Standard SCRT Transaction Fee',
    description: `Standard transaction fee: ${SCRT_TX_FEE} SCRT`,
    value: SCRT_TX_FEE.toString(),
    templateVariable: 'SCRT_TX_FEE',
    metadata: {
      type: 'fee',
      unit: 'SCRT',
    },
  });

  resources.push({
    id: 'staking-tx-fee',
    category: 'fees',
    name: 'Staking Transaction Fee',
    description: `Staking transaction fee: ${STAKING_TX_FEE} SCRT`,
    value: STAKING_TX_FEE.toString(),
    templateVariable: 'STAKING_TX_FEE',
    metadata: {
      type: 'fee',
      unit: 'SCRT',
    },
  });

  // Block Height Template Variables
  resources.push({
    id: 'current-height',
    category: 'custom',
    name: 'Current Block Height',
    description: 'Template variable for current block height (auto-fetched)',
    value: '{{HEIGHT}}',
    templateVariable: 'HEIGHT',
    metadata: {
      type: 'template',
      description: 'Will be replaced with the current block height when auto-fetch is enabled',
    },
  });

  resources.push({
    id: 'block-height',
    category: 'custom',
    name: 'Block Height (Alternative)',
    description: 'Alternative template variable for block height',
    value: '{{BLOCK_HEIGHT}}',
    templateVariable: 'BLOCK_HEIGHT',
    metadata: {
      type: 'template',
      description: 'Alternative naming for block height template variable',
    },
  });

  // Wallet & Viewing Key Template Variables
  resources.push({
    id: 'wallet-address',
    category: 'custom',
    name: 'Wallet Address',
    description: 'Template variable for connected wallet address',
    value: '{{ADDRESS}}',
    templateVariable: 'ADDRESS',
    metadata: {
      type: 'template',
      description: 'Will be replaced with the connected wallet address from Keplr',
    },
  });

  resources.push({
    id: 'viewing-key',
    category: 'custom',
    name: 'Viewing Key',
    description: 'Template variable for viewing key from Keplr',
    value: '{{VIEWING_KEY}}',
    templateVariable: 'VIEWING_KEY',
    metadata: {
      type: 'template',
      description: 'Will be replaced with the viewing key for the contract address',
    },
  });

  return resources;
}

/**
 * Get resources grouped by category
 */
export function getResourcesByCategory(): Record<string, ResourceItem[]> {
  const resources = getDefaultResources();
  const grouped: Record<string, ResourceItem[]> = {};

  resources.forEach((resource) => {
    if (!grouped[resource.category]) {
      grouped[resource.category] = [];
    }
    grouped[resource.category]?.push(resource);
  });

  return grouped;
}

/**
 * Search resources by name or description
 */
export function searchResources(query: string, resources: ResourceItem[]): ResourceItem[] {
  const lowercaseQuery = query.toLowerCase();
  return resources.filter(
    (resource) =>
      resource.name.toLowerCase().includes(lowercaseQuery) ||
      resource.description?.toLowerCase().includes(lowercaseQuery) ||
      resource.templateVariable.toLowerCase().includes(lowercaseQuery)
  );
}
