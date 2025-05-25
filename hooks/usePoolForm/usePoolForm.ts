import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { usePoolStaking } from '@/hooks/usePoolStaking';
import { usePoolStore } from '@/store/forms/poolStore';
import { useTxStore } from '@/store/txStore';
import { PoolTokenInputs, SecretString } from '@/types';
import { Asset, ContractInfo } from '@/types/secretswap/shared';
import isNotNullish from '@/utils/isNotNullish';
import { calculateWithdrawalAmounts } from '@/utils/secretjs/pools/calculateWithdrawalAmounts';
import { provideLiquidity } from '@/utils/secretjs/pools/provideLiquidity';
import { withdrawLiquidity } from '@/utils/secretjs/pools/withdrawLiquidity';
import { Window } from '@keplr-wallet/types';
import { useQuery } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { SecretNetworkClient, TxResultCode } from 'secretjs';
import { fetchPoolData, validatePoolAddress } from './queryFunctions';
import type {
  LoadingState,
  SelectedPoolType,
  UsePoolDepositFormResult,
  WithdrawEstimate,
} from './types';

// Define the store's token input type with proper index signature
interface TokenInputs extends PoolTokenInputs {
  [key: string]: { amount: string; balance: string };
}

// Add new interface for pool calculations
interface PoolMetrics {
  poolShare: string;
  txFee: string;
  ratioDeviation: string; // How much the provided ratio deviates from pool ratio (in %)
}

// Standard network fee for Secret Network
const SCRT_TX_FEE = '0.0001';

// Add this type definition for array logs at the top of the file
interface TxLogEntry {
  type: string;
  key: string;
  value: string | { [key: string]: unknown } | Record<string, unknown>;
  msg?: number;
}

function calculatePoolMetrics(
  amount0: string,
  amount1: string,
  reserve0: string,
  reserve1: string
): PoolMetrics {
  const amt0 = new Decimal(amount0);
  const amt1 = new Decimal(amount1);
  const res0 = new Decimal(reserve0);
  const res1 = new Decimal(reserve1);

  // Calculate pool share
  const totalSupply0 = res0.add(amt0);
  const poolShare = amt0.div(totalSupply0).mul(100).toFixed(6);

  // Calculate ratio deviation
  let ratioDeviation = '0';
  if (!res0.isZero() && !res1.isZero() && !amt0.isZero() && !amt1.isZero()) {
    const poolRatio = res0.div(res1);
    const providedRatio = amt0.div(amt1);
    ratioDeviation = providedRatio.sub(poolRatio).div(poolRatio).mul(100).abs().toFixed(6);
  }

  return {
    poolShare,
    ratioDeviation,
    txFee: SCRT_TX_FEE,
  };
}

// Add debounce utility with proper types
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => void func(...args), wait);
  };
}

export function usePoolForm(
  poolAddress: SecretString | SecretString[] | undefined
): UsePoolDepositFormResult {
  const { tokenInputs, selectedPool, setTokenInputAmount, setSelectedPool } = usePoolStore();
  const { secretjs, walletAddress } = useKeplrConnection();
  const { setPending, setResult } = useTxStore.getState();

  // Use the poolStaking hook instead of directly integrating staking logic
  const poolStaking = usePoolStaking(typeof poolAddress === 'string' ? poolAddress : null);
  const { hasStakingRewards, stakingInfo, staking, autoStake, setAutoStake, autoStakeLpTokens } =
    poolStaking;

  const initialMountRef = useRef(true);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const balanceCache = useRef<
    Map<string, { balance: { balance: { amount: string } } | null; timestamp: number }>
  >(new Map());
  const pendingRequests = useRef<Map<string, Promise<{ balance: { amount: string } } | null>>>(
    new Map()
  );

  // Cache duration: 30 seconds
  const BALANCE_CACHE_DURATION = 30000;

  async function getTokenBalance(
    secretjs: SecretNetworkClient,
    tokenAddress: SecretString,
    tokenCodeHash: string
  ): Promise<{ balance: { amount: string } } | null> {
    const cacheKey = `${tokenAddress}-${secretjs.address}`;

    // Check cache first
    const cached = balanceCache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < BALANCE_CACHE_DURATION) {
      console.log(`Using cached balance for ${tokenAddress}`);
      return cached.balance;
    }

    // Check if request is already pending
    const pendingRequest = pendingRequests.current.get(cacheKey);
    if (pendingRequest) {
      console.log(`Waiting for pending request for ${tokenAddress}`);
      return pendingRequest;
    }

    const keplr = (window as unknown as Window).keplr;
    if (!isNotNullish(keplr)) {
      toast.error('Please install the Keplr extension');
      return null;
    }

    // Create and cache the promise
    const requestPromise = (async () => {
      try {
        // Add delay to prevent rate limiting
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500));

        // First try to get the viewing key
        let viewingKey = await keplr
          .getSecret20ViewingKey('secret-4', tokenAddress)
          .catch(() => null);

        // If no viewing key, suggest the token first
        if (viewingKey === null) {
          try {
            await keplr.suggestToken('secret-4', tokenAddress);
            // Try getting the key again after suggesting
            viewingKey = await keplr
              .getSecret20ViewingKey('secret-4', tokenAddress)
              .catch(() => null);
          } catch (error) {
            console.error('Error suggesting token:', error);
            return null;
          }
        }

        if (viewingKey === null) {
          console.error('No viewing key available after suggesting token');
          return null;
        }

        const balance = await secretjs.query.snip20.getBalance({
          contract: {
            address: tokenAddress,
            code_hash: tokenCodeHash,
          },
          address: secretjs.address,
          auth: { key: viewingKey },
        });

        // Cache the result
        balanceCache.current.set(cacheKey, {
          balance,
          timestamp: Date.now(),
        });

        return balance;
      } catch (error) {
        console.error('Error getting token balance:', error);
        return null;
      } finally {
        // Remove from pending requests
        pendingRequests.current.delete(cacheKey);
      }
    })();

    // Cache the promise
    pendingRequests.current.set(cacheKey, requestPromise);

    return requestPromise;
  }

  // Debounced balance fetching with proper rate limiting
  useEffect(() => {
    if (!secretjs || !walletAddress) return;

    // Skip the first mount and wait 2 seconds
    if (initialMountRef.current) {
      initialMountRef.current = false;
      const timer = setTimeout(() => {
        setIsBalanceLoading(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (!isBalanceLoading || !selectedPool?.token0 || !selectedPool?.token1) return;

    const fetchBalancesWithRateLimit = debounce(async () => {
      try {
        console.log('Fetching token balances for wallet:', walletAddress);

        const token0Address = selectedPool.token0?.address;
        const token1Address = selectedPool.token1?.address;
        const token0CodeHash = selectedPool.token0?.codeHash;
        const token1CodeHash = selectedPool.token1?.codeHash;

        if (!token0Address || !token1Address || !token0CodeHash || !token1CodeHash) {
          console.error('Missing token information');
          return;
        }

        // Fetch balances with staggered timing to avoid rate limits
        const balance0Promise = getTokenBalance(secretjs, token0Address, token0CodeHash);

        // Wait 1 second before second request
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const balance1Promise = getTokenBalance(secretjs, token1Address, token1CodeHash);

        const [balance0, balance1] = await Promise.all([balance0Promise, balance1Promise]);

        console.log('Balance of token0:', balance0);
        console.log('Balance of token1:', balance1);

        // Update the store with the fetched balances if needed
        // This would require extending the store to handle balance updates
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    }, 2000); // Increased debounce time

    void fetchBalancesWithRateLimit();
  }, [walletAddress, selectedPool, secretjs, isBalanceLoading]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['pool-data', poolAddress],
    queryFn: async () => {
      const validPoolAddress = validatePoolAddress(poolAddress);

      // Find the pair contract code hash from the LIQUIDITY_PAIRS configuration
      const pairInfo = LIQUIDITY_PAIRS.find((pair) => pair.pairContract === validPoolAddress);

      // Use the pair contract code hash from config or a fallback if not found
      // We know LIQUIDITY_PAIRS[0] exists and has a pairContractCodeHash
      const pairCodeHash =
        pairInfo?.pairContractCodeHash != null
          ? pairInfo?.pairContractCodeHash
          : LIQUIDITY_PAIRS[0]?.pairContractCodeHash;

      return await fetchPoolData(validPoolAddress, pairCodeHash, (pool: SelectedPoolType) => {
        // Get the LP token address from LIQUIDITY_PAIRS configuration
        const lpTokenAddress = pairInfo?.lpToken || '';

        setSelectedPool({
          address: pool.address,
          token0: pool.token0,
          token1: pool.token1,
          pairInfo: {
            ...pool.pairInfo,
            liquidity_token: lpTokenAddress as SecretString,
            token_code_hash: pairInfo?.lpTokenCodeHash || '',
            asset0_volume: '0',
            asset1_volume: '0',
            factory: {
              address: '',
              code_hash: '',
            },
          },
        });
      });
    },
    enabled: typeof poolAddress === 'string',
    // Add stale time to prevent excessive refetching
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes (renamed from cacheTime in newer versions)
  });

  const loadingState: LoadingState = {
    status: isLoading === true ? 'loading' : error instanceof Error ? 'error' : 'success',
    message:
      isLoading === true
        ? 'Loading pool data...'
        : error instanceof Error
        ? error.message
        : undefined,
  };

  const safeTokenInputs = tokenInputs as unknown as TokenInputs;

  const setMax = (inputIdentifier: string): void => {
    if (inputIdentifier in safeTokenInputs) {
      const balance = safeTokenInputs[inputIdentifier]?.balance;
      if (balance !== undefined && balance !== '' && balance !== null) {
        setTokenInputAmount(inputIdentifier as keyof typeof tokenInputs, balance);
      }
    }
  };

  function convertAmount(amount: string, decimals: number): string {
    // Parse the amount as a decimal number
    const decimalAmount = parseFloat(amount);
    // Multiply by 10^decimals and round to avoid floating-point precision issues
    const convertedAmount = Math.round(decimalAmount * Math.pow(10, decimals));
    // Convert the result back to a string
    return convertedAmount.toString();
  }

  const handleDepositClick = async (): Promise<void> => {
    if (!selectedPool?.token0 || !selectedPool?.token1) return;
    if (!secretjs) return;
    if (!data?.pairPoolData) {
      toast.error('Pool data not available');
      return;
    }

    const inputIdentifier1 = `pool.deposit.tokenA`;
    const inputIdentifier2 = `pool.deposit.tokenB`;

    const amount0 = safeTokenInputs[inputIdentifier1]?.amount ?? '0';
    const amount1 = safeTokenInputs[inputIdentifier2]?.amount ?? '0';

    if (amount0 === '0' || amount1 === '0') {
      toast.error('Please enter an amount for both tokens');
      return;
    }

    const address0 = selectedPool.token0.address;
    const address1 = selectedPool.token1.address;

    if (address0 === undefined || address1 === undefined) {
      toast.error('Undefined token address');
      return;
    }

    // Get current pool reserves
    const { assets } = data.pairPoolData;
    if (!Array.isArray(assets) || assets.length !== 2) {
      toast.error('Invalid pool data');
      return;
    }

    // Calculate pool metrics
    const metrics = calculatePoolMetrics(
      amount0,
      amount1,
      assets[0]?.amount ?? '0',
      assets[1]?.amount ?? '0'
    );

    // Get the pair contract code hash from the LIQUIDITY_PAIRS configuration
    const pairInfo = LIQUIDITY_PAIRS.find((pair) => pair.pairContract === selectedPool.address);

    // Use the pair contract code hash from config or a fallback if not found
    // We know LIQUIDITY_PAIRS[0] exists and has a pairContractCodeHash
    const pairCodeHash =
      pairInfo?.pairContractCodeHash != null
        ? pairInfo?.pairContractCodeHash
        : LIQUIDITY_PAIRS[0]!.pairContractCodeHash;

    const pairContract: ContractInfo = {
      address: selectedPool.address,
      code_hash: pairCodeHash,
    };

    const asset0: Asset = {
      info: {
        token: {
          contract_addr: address0,
          token_code_hash: selectedPool.token0.codeHash,
          viewing_key: 'SecretSwap',
        },
      },
      amount: convertAmount(amount0, selectedPool.token0.decimals),
    };

    const asset1: Asset = {
      info: {
        token: {
          contract_addr: address1,
          token_code_hash: selectedPool.token1.codeHash,
          viewing_key: 'SecretSwap',
        },
      },
      amount: convertAmount(amount1, selectedPool.token1.decimals),
    };

    console.log('Deposit clicked', {
      pool: selectedPool.address,
      token0: selectedPool.token0.symbol,
      amount0,
      token1: selectedPool.token1.symbol,
      amount1,
      poolShare: metrics.poolShare,
      ratioDeviation: metrics.ratioDeviation,
      txFee: metrics.txFee,
      autoStake, // Log if auto-stake is enabled
    });

    try {
      setPending(true);

      // Execute liquidity provision transaction
      const result = await provideLiquidity(secretjs, pairContract, asset0, asset1);

      setPending(false);
      setResult(result);

      console.log('Transaction Result:', JSON.stringify(result, null, 4));

      if (result.code !== TxResultCode.Success) {
        throw new Error(`Deposit failed: ${result.rawLog}`);
      }

      // Auto-stake if enabled and staking is available
      if (autoStake && hasStakingRewards) {
        try {
          // Extract LP token amount from transaction events
          const lpAmount = extractLpAmountFromTx(result);

          if (lpAmount !== null && lpAmount !== '') {
            // Stake the LP tokens
            const stakeResult = await autoStakeLpTokens(lpAmount);

            if (stakeResult) {
              toast.success('Successfully provided liquidity and staked LP tokens');
            }
          } else {
            console.error('Could not extract LP token amount from transaction');
            toast.warning(
              'Liquidity provided but auto-staking failed: could not determine LP amount'
            );
          }
        } catch (stakeError) {
          console.error('Error auto-staking LP tokens:', stakeError);
          toast.error('Liquidity provided but auto-staking failed');
        }
      } else {
        toast.success('Liquidity provided successfully');
      }
    } catch (error) {
      console.error('Error during tx execution:', error);
      toast.error('Transaction failed. Check the console for more details.');
      setPending(false);
    }
  };

  const handleWithdrawClick = async (): Promise<void> => {
    if (!selectedPool?.token0 || !selectedPool?.token1) return;
    if (!secretjs) return;
    if (!selectedPool.pairInfo.liquidity_token || !selectedPool.pairInfo.token_code_hash) {
      toast.error('LP token info not available');
      return;
    }

    const inputIdentifier = `pool.withdraw.lpToken`;
    let amount = safeTokenInputs[inputIdentifier]?.amount ?? '0';

    if (amount === '0') {
      toast.error('Please enter an amount of LP tokens to withdraw');
      return;
    }

    // Get the pair contract code hash from the LIQUIDITY_PAIRS configuration
    const pairInfo = LIQUIDITY_PAIRS.find((pair) => pair.pairContract === selectedPool.address);

    // Use the pair contract code hash from config or a fallback if not found
    // We know LIQUIDITY_PAIRS[0] exists and has a pairContractCodeHash
    const pairCodeHash =
      pairInfo?.pairContractCodeHash != null
        ? pairInfo?.pairContractCodeHash
        : LIQUIDITY_PAIRS[0]!.pairContractCodeHash;

    const pairContract: ContractInfo = {
      address: selectedPool.address,
      code_hash: pairCodeHash,
    };

    // TODO: Map token address to code_hash. They will all be the same for now.
    const lpTokenContract: ContractInfo = {
      address: selectedPool.pairInfo.liquidity_token,
      code_hash: '744C588ED4181B13A49A7C75A49F10B84B22B24A69B1E5F3CDFF34B2C343E888',
    };

    console.log('Withdraw clicked', {
      pool: pairContract.address,
      lpToken: lpTokenContract.address,
      lpTokenCodeHash: lpTokenContract.code_hash,
      amount,
    });

    try {
      setPending(true);

      // NOTE: All LP tokens have 6 decimals.
      amount = convertAmount(amount, 6);
      const result = await withdrawLiquidity(secretjs, lpTokenContract, pairContract, amount);

      setPending(false);
      setResult(result);

      console.log('Transaction Result:', JSON.stringify(result, null, 4));

      if (result.code !== TxResultCode.Success) {
        throw new Error(`Withdrawal failed: ${result.rawLog}`);
      }

      toast.success('Liquidity withdrawn successfully');
    } catch (error) {
      console.error('Error during tx execution:', error);
      toast.error('Transaction failed. Check the console for more details.');
      setPending(false);
    }
  };

  const handleClick = (intent: 'deposit' | 'withdraw'): void => {
    if (intent === 'deposit') {
      void handleDepositClick();
    } else if (intent === 'withdraw') {
      void handleWithdrawClick();
    }
  };

  const [withdrawEstimate, setWithdrawEstimate] = useState<WithdrawEstimate | null>(null);

  // Add calculation effect
  useEffect(() => {
    if (data?.pairPoolData === undefined || selectedPool === undefined || selectedPool === null)
      return;

    const lpAmount = safeTokenInputs['pool.withdraw.lpToken']?.amount;

    // Improved validation to handle empty strings and invalid numbers
    if (
      !lpAmount ||
      lpAmount.trim() === '' ||
      isNaN(parseFloat(lpAmount)) ||
      parseFloat(lpAmount) <= 0
    ) {
      setWithdrawEstimate(null);
      return;
    }

    const { assets, total_share } = data.pairPoolData;
    if (!Array.isArray(assets) || assets.length !== 2 || total_share === undefined) {
      return;
    }

    // Add validation for zero values
    if (total_share === '0') {
      setWithdrawEstimate({
        token0Amount: '0',
        token1Amount: '0',
      });
      return;
    }

    const asset0Amount = assets[0]?.amount;
    const asset1Amount = assets[1]?.amount;

    if (asset0Amount === undefined || asset1Amount === undefined) {
      return;
    }

    if (!selectedPool.token0 || !selectedPool.token1) {
      return;
    }

    // Use the new utility function
    const result = calculateWithdrawalAmounts({
      lpAmount,
      totalLpSupply: total_share,
      asset0Amount,
      asset1Amount,
      token0: selectedPool.token0,
      token1: selectedPool.token1,
    });

    if (result.isValid) {
      setWithdrawEstimate({
        token0Amount: result.token0Amount,
        token1Amount: result.token1Amount,
      });
    } else {
      setWithdrawEstimate({
        token0Amount: '0',
        token1Amount: '0',
      });
    }
  }, [data?.pairPoolData, safeTokenInputs['pool.withdraw.lpToken']?.amount, selectedPool]);

  const typedSelectedPool = (() => {
    if (selectedPool === undefined || selectedPool === null) return null;
    if (!selectedPool.token0 || !selectedPool.token1) return null;

    // Ensure all contract addresses match the secret1 format
    const isSecret1Address = (addr: string): addr is SecretString => addr.startsWith('secret1');

    const contractAddr = selectedPool.pairInfo.contract_addr;
    const liquidityToken = selectedPool.pairInfo.liquidity_token;

    if (!isSecret1Address(contractAddr) || !isSecret1Address(liquidityToken)) return null;

    const typedAssetInfos = selectedPool.pairInfo.asset_infos.map((info) => {
      if (!isSecret1Address(info.token.contract_addr)) return null;
      return {
        token: {
          contract_addr: info.token.contract_addr,
          token_code_hash: info.token.token_code_hash,
          viewing_key: info.token.viewing_key,
        },
      };
    });

    if (typedAssetInfos.some((info) => info === null)) return null;

    return {
      address: selectedPool.address,
      token0: selectedPool.token0,
      token1: selectedPool.token1,
      pairInfo: {
        contract_addr: contractAddr,
        asset_infos: typedAssetInfos as {
          token: {
            contract_addr: SecretString;
            token_code_hash: string;
            viewing_key: string;
          };
        }[],
        liquidity_token: liquidityToken,
        token_code_hash: selectedPool.pairInfo.token_code_hash,
      },
    };
  })();

  return {
    tokenInputs: safeTokenInputs,
    setTokenInputAmount: (key: string, value: string) =>
      setTokenInputAmount(key as keyof typeof tokenInputs, value),
    setMax,
    selectedPool: typedSelectedPool,
    loadingState,
    poolDetails: data?.poolDetails,
    pairPoolData: data?.pairPoolData,
    handleClick,
    withdrawEstimate,

    // Staking properties from usePoolStaking
    hasStakingRewards,
    stakingInfo,
    staking,
    autoStake,
    setAutoStake,
  };
}

// Add this function near other utility functions in the file
function extractLpAmountFromTx(txResult: { arrayLog?: TxLogEntry[] }): string | null {
  try {
    // Look for mint or transfer event in transaction logs
    const { arrayLog } = txResult;
    if (!arrayLog || !Array.isArray(arrayLog)) return null;

    // Find the mint event from the liquidity token contract
    for (const log of arrayLog) {
      // Skip non-wasm logs
      if (typeof log.type !== 'string' || log.type !== 'wasm') continue;

      // Check for mint event
      if (typeof log.key === 'string' && log.key === 'mint') {
        // Handle case where value is an object
        if (typeof log.value === 'object' && log.value !== null) {
          const valueObj = log.value as Record<string, unknown>;
          if ('amount' in valueObj && typeof valueObj['amount'] === 'string') {
            return valueObj['amount'];
          }
        }

        // Handle case where value is a JSON string
        if (typeof log.value === 'string') {
          try {
            const parsed = JSON.parse(log.value) as Record<string, unknown>;
            if (parsed != null && 'amount' in parsed && typeof parsed['amount'] === 'string') {
              return parsed['amount'];
            }
          } catch (_) {
            // Ignore parsing errors
          }
        }
      }

      // Check for transfer event as fallback
      if (typeof log.key === 'string' && log.key === 'transfer') {
        // Handle case where value is an object
        if (typeof log.value === 'object' && log.value !== null) {
          const valueObj = log.value as Record<string, unknown>;
          if ('amount' in valueObj && typeof valueObj['amount'] === 'string') {
            return valueObj['amount'];
          }
        }

        // Handle case where value is a JSON string
        if (typeof log.value === 'string') {
          try {
            const parsed = JSON.parse(log.value) as Record<string, unknown>;
            if (parsed != null && 'amount' in parsed && typeof parsed['amount'] === 'string') {
              return parsed['amount'];
            }
          } catch (_) {
            // Ignore parsing errors
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting LP amount from transaction:', error);
    return null;
  }
}
