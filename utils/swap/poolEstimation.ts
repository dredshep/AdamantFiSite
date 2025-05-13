import { POOL_FEE, SCRT_TX_FEE, feeToDecimal } from '@/config/fees';
import { ConfigToken } from '@/config/tokens';
import { queryFactoryPairs } from '@/utils/apis/getFactoryPairs';
import Decimal from 'decimal.js';
import { SecretNetworkClient } from 'secretjs';

interface TokenReserve {
  amount: Decimal;
  decimals: number;
}

interface PoolReserves {
  [tokenAddress: string]: TokenReserve;
}

interface TokenInfo {
  token: {
    contract_addr: string;
    token_code_hash: string;
  };
}

interface PairResponse {
  asset_infos: [TokenInfo, TokenInfo];
  contract_addr: string;
  liquidity_token: string;
  asset0_volume: string;
  asset1_volume: string;
}

function isPairResponse(response: unknown): response is PairResponse {
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  const pairInfo = response as PairResponse;
  return (
    'asset_infos' in pairInfo &&
    Array.isArray(pairInfo.asset_infos) &&
    pairInfo.asset_infos.length === 2 &&
    'contract_addr' in pairInfo &&
    'liquidity_token' in pairInfo
  );
}

interface PoolAsset {
  info: {
    token: {
      contract_addr: string;
    };
  };
  amount: string;
}

interface PoolResponse {
  assets: PoolAsset[];
  total_share: string;
}

function isPoolResponse(response: unknown): response is PoolResponse {
  if (typeof response !== 'object' || response === null || !('assets' in response)) {
    return false;
  }

  const poolResponse = response as PoolResponse;
  return (
    Array.isArray(poolResponse.assets) &&
    poolResponse.assets.every(
      (asset) =>
        typeof asset === 'object' &&
        asset !== null &&
        'info' in asset &&
        'amount' in asset &&
        typeof asset.amount === 'string'
    )
  );
}

interface SwapEstimation {
  outputAmount: string;
  priceImpact: string;
  poolFee: string;
  txFee: string;
}

export async function estimateSwapOutput(
  secretjs: SecretNetworkClient,
  _poolAddress: string,
  payToken: ConfigToken,
  receiveToken: ConfigToken,
  amountIn: string
): Promise<SwapEstimation> {
  try {
    const payTokenAddress = payToken.address;
    const receiveTokenAddress = receiveToken.address;

    if (
      typeof payTokenAddress !== 'string' ||
      !payTokenAddress ||
      typeof receiveTokenAddress !== 'string' ||
      !receiveTokenAddress
    ) {
      throw new Error('Token addresses not properly initialized');
    }

    // Get token code hashes directly from the ConfigToken objects
    const payTokenCodeHash = payToken.codeHash;
    const receiveTokenCodeHash = receiveToken.codeHash;

    if (!payTokenCodeHash) {
      throw new Error(`Code hash not found for pay token: ${payTokenAddress}`);
    }

    if (!receiveTokenCodeHash) {
      throw new Error(`Code hash not found for receive token: ${receiveTokenAddress}`);
    }

    // Get all pairs from factory
    const pairs = await queryFactoryPairs();

    // Find the pair for our tokens
    const pair = pairs.find((p) => {
      const addr0 = p.asset_infos[0]?.token?.contract_addr;
      const addr1 = p.asset_infos[1]?.token?.contract_addr;
      if (typeof addr0 !== 'string' || typeof addr1 !== 'string') return false;

      return (
        (addr0 === payTokenAddress && addr1 === receiveTokenAddress) ||
        (addr0 === receiveTokenAddress && addr1 === payTokenAddress)
      );
    });

    if (!pair || !pair.contract_addr || !pair.token_code_hash) {
      throw new Error(`No pool found for token pair ${payTokenAddress} <> ${receiveTokenAddress}`);
    }

    const correctPoolAddress = pair.contract_addr;

    // Query pool info with code hash
    const response = await secretjs.query.compute.queryContract({
      contract_address: correctPoolAddress,
      code_hash: pair.token_code_hash,
      query: { pair: {} },
    });

    if (!isPairResponse(response)) {
      throw new Error('Invalid pool response structure');
    }

    // Query pool reserves with code hash
    const poolResponse = await secretjs.query.compute.queryContract({
      contract_address: correctPoolAddress,
      code_hash: pair.token_code_hash,
      query: { pool: {} },
    });

    if (!isPoolResponse(poolResponse)) {
      throw new Error('Invalid pool reserves response');
    }

    // Create reserves map from pool response
    const reserves: PoolReserves = {};

    // Map assets to reserves
    poolResponse.assets.forEach((asset, index) => {
      const assetInfo = response.asset_infos[index];
      const contractAddr = assetInfo?.token?.contract_addr;
      if (typeof contractAddr !== 'string' || !contractAddr) {
        throw new Error(`Invalid asset info at index ${index}`);
      }
      const tokenAddr = contractAddr;
      const amount = new Decimal(asset.amount);

      // Check for zero liquidity
      if (amount.isZero()) {
        throw new Error(`Pool has no liquidity for token ${tokenAddr}`);
      }

      reserves[tokenAddr] = {
        amount,
        decimals: 6, // All tokens use 6 decimals
      };
    });

    const inputReserve = reserves[payTokenAddress];
    const outputReserve = reserves[receiveTokenAddress];

    if (!inputReserve || !outputReserve) {
      throw new Error(
        `Could not find reserves for tokens. Pay token: ${payTokenAddress}, Receive token: ${receiveTokenAddress}`
      );
    }

    // Standard fee for SecretSwap pools
    const poolFeeDecimal = feeToDecimal(POOL_FEE);
    const scrtTxFeeDecimal = SCRT_TX_FEE;

    const amountInDecimal = new Decimal(amountIn);
    const amountInAdjusted = amountInDecimal.mul(Decimal.pow(10, inputReserve.decimals));
    const feeMultiplier = new Decimal(1).sub(poolFeeDecimal);
    const amountInWithFee = amountInAdjusted.mul(feeMultiplier);

    const productOfReserves = inputReserve.amount.mul(outputReserve.amount);
    const newInputReserve = inputReserve.amount.add(amountInWithFee);
    const newOutputReserve = productOfReserves.div(newInputReserve);
    const output = outputReserve.amount.sub(newOutputReserve);

    // Adjust output by decimals
    const adjustedOutput = output.div(Decimal.pow(10, outputReserve.decimals));

    // Calculate price impact
    // Price impact is the change in price due to the trade size relative to pool reserves
    const spotPrice = outputReserve.amount.div(inputReserve.amount);
    const executionPrice = adjustedOutput.div(amountInDecimal);
    const priceImpact = spotPrice.sub(executionPrice).div(spotPrice).mul(100).toFixed(4);

    // Calculate fees
    const poolFeeAmount = amountInDecimal.mul(poolFeeDecimal).toFixed(6);
    const txFeeAmount = new Decimal(scrtTxFeeDecimal).toFixed(6);

    return {
      outputAmount: adjustedOutput.toFixed(6),
      priceImpact,
      poolFee: poolFeeAmount,
      txFee: txFeeAmount,
    };
  } catch (error) {
    console.error('Estimation error:', error instanceof Error ? error.message : 'Unknown error');
    return {
      outputAmount: '0',
      priceImpact: '0',
      poolFee: '0',
      txFee: '0',
    };
  }
}
