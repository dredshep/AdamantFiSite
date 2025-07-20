import { LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { usePoolStaking } from '@/hooks/usePoolStaking';
import { usePoolStore } from '@/store/forms/poolStore';
import { useTxStore } from '@/store/txStore';
import { PoolTokenInputs, SecretString } from '@/types';
import { Asset, ContractInfo } from '@/types/secretswap/shared';
import {
  calculateProportionalAmount,
  convertPoolReservesToFormat,
} from '@/utils/pool/ratioCalculation';
import { calculateWithdrawalAmounts } from '@/utils/secretjs/pools/calculateWithdrawalAmounts';
import { provideLiquidity } from '@/utils/secretjs/pools/provideLiquidity';
import { withdrawLiquidity } from '@/utils/secretjs/pools/withdrawLiquidity';
import { getTokenBalance } from '@/utils/secretjs/tokens/getTokenBalance';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { TxResultCode } from 'secretjs';
import { fetchPoolData, validatePoolAddress } from './queryFunctions';
import type {
  LoadingState,
  SelectedPoolType,
  UsePoolDepositFormResult,
  ValidationWarning,
  WithdrawEstimate,
} from './types';

// Define the store's token input type with proper index signature
interface TokenInputs extends PoolTokenInputs {
  [key: string]: { amount: string; balance: string };
}

// Add new interface for pool calculations
// interface PoolMetrics {
//   poolShare: string;
//   txFee: string;
//   ratioDeviation: string; // How much the provided ratio deviates from pool ratio (in %)
// }

// Standard network fee for Secret Network
// const SCRT_TX_FEE = '0.0001';

// Currently unused but available for future features
// function calculatePoolMetrics(
//   amount0: string,
//   amount1: string,
//   reserve0: string,
//   reserve1: string
// ): PoolMetrics {
//   // Validate and sanitize inputs
//   const sanitizeAmount = (amount: string): string => {
//     if (!amount || amount.trim() === '' || isNaN(parseFloat(amount))) {
//       return '0';
//     }
//     return amount.trim();
//   };

//   const sanitizedAmount0 = sanitizeAmount(amount0);
//   const sanitizedAmount1 = sanitizeAmount(amount1);
//   const sanitizedReserve0 = sanitizeAmount(reserve0);
//   const sanitizedReserve1 = sanitizeAmount(reserve1);

//   try {
//     const amt0 = new Decimal(sanitizedAmount0);
//     const amt1 = new Decimal(sanitizedAmount1);
//     const res0 = new Decimal(sanitizedReserve0);
//     const res1 = new Decimal(sanitizedReserve1);

//     // Calculate pool share
//     const totalSupply0 = res0.add(amt0);
//     const poolShare = totalSupply0.isZero() ? '0' : amt0.div(totalSupply0).mul(100).toFixed(6);

//     // Calculate ratio deviation
//     let ratioDeviation = '0';
//     if (!res0.isZero() && !res1.isZero() && !amt0.isZero() && !amt1.isZero()) {
//       const poolRatio = res0.div(res1);
//       const providedRatio = amt0.div(amt1);
//       ratioDeviation = providedRatio.sub(poolRatio).div(poolRatio).mul(100).abs().toFixed(6);
//     }

//     return {
//       poolShare,
//       ratioDeviation,
//       txFee: SCRT_TX_FEE,
//     };
//   } catch (error) {
//     console.error('Error calculating pool metrics:', error, {
//       amount0,
//       amount1,
//       reserve0,
//       reserve1,
//     });

//     // Return safe defaults
//     return {
//       poolShare: '0',
//       ratioDeviation: '0',
//       txFee: SCRT_TX_FEE,
//     };
//   }
// }

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
  const router = useRouter();

  // Use the poolStaking hook instead of directly integrating staking logic
  const poolStaking = usePoolStaking(typeof poolAddress === 'string' ? poolAddress : null);
  const { hasStakingRewards, stakingInfo, staking, autoStake, setAutoStake, autoStakeLpTokens } =
    poolStaking;

  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  // Effect to pre-fill form from URL query parameters
  useEffect(() => {
    // Ensure this runs only once on the client, after the router is ready
    if (!router.isReady || !selectedPool) return;

    const { token: tokenSymbol, amount } = router.query;

    if (typeof tokenSymbol === 'string') {
      // Find tokens using the pool's token symbols
      let tokenIdentifier: 'pool.deposit.tokenA' | 'pool.deposit.tokenB' | null = null;

      if (tokenSymbol === selectedPool.token0) {
        tokenIdentifier = 'pool.deposit.tokenA';
      } else if (tokenSymbol === selectedPool.token1) {
        tokenIdentifier = 'pool.deposit.tokenB';
      }

      if (tokenIdentifier) {
        // Pre-fill the amount if provided
        if (typeof amount === 'string' && amount.trim() !== '') {
          setTokenInputAmount(tokenIdentifier, amount);
        }

        // Clean the URL to prevent re-filling on refresh
        const newPath = `/pool/${selectedPool.pairContract}`;
        void router.replace(newPath, undefined, { shallow: true });
      }
    }
  }, [router.isReady, router.query, selectedPool?.pairContract, setTokenInputAmount, router]);

  // Effect to set the selected pool and fetch balances
  useEffect(() => {
    if (!secretjs || !walletAddress || !selectedPool) return;

    // Start balance loading after a short delay
    const timer = setTimeout(() => {
      setIsBalanceLoading(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [secretjs, walletAddress, selectedPool]);

  // Effect to fetch balances with rate limiting
  useEffect(() => {
    if (!isBalanceLoading || !selectedPool || !secretjs || !walletAddress) return;

    const fetchBalancesWithRateLimit = debounce(async () => {
      try {
        const token0 = TOKENS.find((t) => t.symbol === selectedPool.token0);
        const token1 = TOKENS.find((t) => t.symbol === selectedPool.token1);

        if (!token0 || !token1 || !walletAddress) {
          console.error('Missing token information or wallet address');
          return;
        }

        // Fetch balances with staggered timing to avoid rate limits
        const balance0Promise = getTokenBalance(
          secretjs,
          token0.address,
          token0.codeHash,
          walletAddress,
          ''
        );

        // Wait 1 second before second request
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const balance1Promise = getTokenBalance(
          secretjs,
          token1.address,
          token1.codeHash,
          walletAddress,
          ''
        );

        await Promise.all([balance0Promise, balance1Promise]);

        // Update the store with the fetched balances if needed
        // This would require extending the store to handle balance updates
      } catch (_error) {
        // Silent error handling for balance fetching
      }
    }, 2000); // Increased debounce time

    void fetchBalancesWithRateLimit();
  }, [isBalanceLoading, selectedPool, secretjs, walletAddress]);

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

      return await fetchPoolData(validPoolAddress, pairCodeHash, () => {
        // Get the LP token address from LIQUIDITY_PAIRS configuration

        setSelectedPool({
          ...LIQUIDITY_PAIRS.find((p) => p.pairContract === validPoolAddress)!,
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
    if (!selectedPool) return;
    const token0 = TOKENS.find((t) => t.symbol === selectedPool.token0);
    const token1 = TOKENS.find((t) => t.symbol === selectedPool.token1);
    if (!token0 || !token1) return;
    if (!secretjs) return;
    if (!data?.pairPoolData) {
      toast.error('Pool data not available');
      return;
    }

    const inputIdentifier1 = `pool.deposit.tokenA`;
    const inputIdentifier2 = `pool.deposit.tokenB`;

    const amount0 = safeTokenInputs[inputIdentifier1]?.amount ?? '0';
    const amount1 = safeTokenInputs[inputIdentifier2]?.amount ?? '0';

    // Validate amounts are valid numbers and not zero
    const isValidAmount = (amount: string): boolean => {
      if (!amount || amount.trim() === '') return false;
      const num = parseFloat(amount.trim());
      return !isNaN(num) && num > 0;
    };

    if (!isValidAmount(amount0) || !isValidAmount(amount1)) {
      toast.error('Please enter valid amounts for both tokens');
      return;
    }

    // Check if user has sufficient balance (only if balance is available)
    const token0Balance = safeTokenInputs[inputIdentifier1]?.balance;
    const token1Balance = safeTokenInputs[inputIdentifier2]?.balance;

    if (token0Balance && token0Balance !== '0' && parseFloat(amount0) > parseFloat(token0Balance)) {
      toast.error(`Insufficient ${token0.symbol} balance`);
      return;
    }

    if (token1Balance && token1Balance !== '0' && parseFloat(amount1) > parseFloat(token1Balance)) {
      toast.error(`Insufficient ${token1.symbol} balance`);
      return;
    }

    const address0 = token0.address;
    const address1 = token1.address;

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

    // Calculate pool metrics (currently unused but available for future features)
    // const metrics = calculatePoolMetrics(
    //   amount0,
    //   amount1,
    //   assets[0]?.amount ?? '0',
    //   assets[1]?.amount ?? '0'
    // );

    // Get the pair contract code hash from the LIQUIDITY_PAIRS configuration
    const pairInfo = LIQUIDITY_PAIRS.find(
      (pair) => pair.pairContract === selectedPool.pairContract
    );

    // Use the pair contract code hash from config or a fallback if not found
    // We know LIQUIDITY_PAIRS[0] exists and has a pairContractCodeHash
    const pairCodeHash =
      pairInfo?.pairContractCodeHash != null
        ? pairInfo?.pairContractCodeHash
        : LIQUIDITY_PAIRS[0]!.pairContractCodeHash;

    const pairContract: ContractInfo = {
      address: selectedPool.pairContract,
      code_hash: pairCodeHash,
    };

    const asset0: Asset = {
      info: {
        token: {
          contract_addr: address0,
          token_code_hash: token0.codeHash,
          viewing_key: 'SecretSwap',
        },
      },
      amount: convertAmount(amount0, token0.decimals),
    };

    const asset1: Asset = {
      info: {
        token: {
          contract_addr: address1,
          token_code_hash: token1.codeHash,
          viewing_key: 'SecretSwap',
        },
      },
      amount: convertAmount(amount1, token1.decimals),
    };

    try {
      setPending(true);

      // Execute liquidity provision transaction
      const result = await provideLiquidity(secretjs, pairContract, asset0, asset1);

      setPending(false);
      setResult(result);

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
            } else {
              toast.error('Liquidity provided but auto-staking failed');
            }
          } else {
            toast.warning(
              'Liquidity provided but auto-staking failed: could not determine LP amount'
            );
          }
        } catch (_stakeError) {
          toast.error('Liquidity provided but auto-staking failed');
        }
      } else {
        toast.success('Liquidity provided successfully');
      }
    } catch (_error) {
      toast.error('Transaction failed. Please try again.');
      setPending(false);
    }
  };

  const handleWithdrawClick = async (): Promise<void> => {
    if (!selectedPool) return;
    if (!secretjs) return;
    if (!selectedPool.lpToken || !selectedPool.lpTokenCodeHash) {
      toast.error('LP token info not available');
      return;
    }

    const inputIdentifier = `pool.withdraw.lpToken`;
    let amount = safeTokenInputs[inputIdentifier]?.amount ?? '0';
    const lpBalance = safeTokenInputs[inputIdentifier]?.balance;

    if (amount === '0') {
      toast.error('Please enter an amount of LP tokens to withdraw');
      return;
    }

    // Check if user has sufficient LP balance (only if balance is available)
    if (lpBalance && lpBalance !== '0' && parseFloat(amount) > parseFloat(lpBalance)) {
      toast.error(`Insufficient LP token balance. You have ${lpBalance} LP tokens.`);
      return;
    }

    // Get the pair contract code hash from the LIQUIDITY_PAIRS configuration
    const pairInfo = LIQUIDITY_PAIRS.find(
      (pair) => pair.pairContract === selectedPool.pairContract
    );

    // Use the pair contract code hash from config or a fallback if not found
    // We know LIQUIDITY_PAIRS[0] exists and has a pairContractCodeHash
    const pairCodeHash =
      pairInfo?.pairContractCodeHash != null
        ? pairInfo?.pairContractCodeHash
        : LIQUIDITY_PAIRS[0]!.pairContractCodeHash;

    const pairContract: ContractInfo = {
      address: selectedPool.pairContract,
      code_hash: pairCodeHash,
    };

    // TODO: Map token address to code_hash. They will all be the same for now.
    const lpTokenContract: ContractInfo = {
      address: selectedPool.lpToken,
      code_hash: '744C588ED4181B13A49A7C75A49F10B84B22B24A69B1E5F3CDFF34B2C343E888',
    };

    try {
      setPending(true);

      // NOTE: All LP tokens have 6 decimals.
      amount = convertAmount(amount, 6);
      const result = await withdrawLiquidity(secretjs, lpTokenContract, pairContract, amount);

      setPending(false);
      setResult(result);

      if (result.code !== TxResultCode.Success) {
        throw new Error(`Withdrawal failed: ${result.rawLog}`);
      }

      toast.success('Liquidity withdrawn successfully');
    } catch (_error) {
      toast.error('Transaction failed. Please try again.');
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
  const [validationWarning, setValidationWarning] = useState<ValidationWarning | null>(null);

  // Add calculation effect for withdraw estimates and validation
  useEffect(() => {
    if (data?.pairPoolData === undefined || selectedPool === undefined || selectedPool === null)
      return;

    const token0 = TOKENS.find((t) => t.symbol === selectedPool.token0);
    const token1 = TOKENS.find((t) => t.symbol === selectedPool.token1);

    const lpAmount = safeTokenInputs['pool.withdraw.lpToken']?.amount;
    const lpBalance = safeTokenInputs['pool.withdraw.lpToken']?.balance;

    // Clear estimates and warnings for empty input
    if (
      !lpAmount ||
      lpAmount.trim() === '' ||
      isNaN(parseFloat(lpAmount)) ||
      parseFloat(lpAmount) <= 0
    ) {
      setWithdrawEstimate(null);
      setValidationWarning(null);
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
        proportion: '0%',
        isValid: false,
        error: 'No liquidity in pool',
      });
      return;
    }

    const asset0Amount = assets[0]?.amount;
    const asset1Amount = assets[1]?.amount;

    if (asset0Amount === undefined || asset1Amount === undefined) {
      return;
    }

    if (!token0 || !token1) {
      return;
    }

    // Check if user has sufficient LP balance (only if balance is available)
    const lpAmountNum = parseFloat(lpAmount);
    const lpBalanceNum = lpBalance && lpBalance !== '0' ? parseFloat(lpBalance) : null;

    // Set validation warning for insufficient balance
    if (lpBalanceNum !== null && lpAmountNum > lpBalanceNum) {
      setValidationWarning({
        field: 'lpToken',
        message: 'Insufficient LP token balance',
        maxAvailable: lpBalance,
        tokenSymbol: `${token0.symbol}/${token1.symbol} LP`,
      });
    } else {
      setValidationWarning(null);
    }

    // Always calculate the withdrawal amounts (even if exceeding balance)
    // This shows users what they would get proportionally
    const result = calculateWithdrawalAmounts({
      lpAmount,
      totalLpSupply: total_share,
      asset0Amount,
      asset1Amount,
      token0: token0,
      token1: token1,
    });

    // Only show calculation errors that aren't about exceeding pool supply
    // (since that's a technical limitation, not a user error)
    if (result.isValid) {
      const proportionDisplay = (result.proportion * 100).toFixed(4) + '%';
      setWithdrawEstimate({
        token0Amount: result.token0Amount,
        token1Amount: result.token1Amount,
        proportion: proportionDisplay,
        isValid: true,
      });
    } else if (result.error && !result.error.includes('Total pool supply is only')) {
      // Only show non-pool-supply errors
      setWithdrawEstimate({
        token0Amount: '0',
        token1Amount: '0',
        proportion: '0%',
        isValid: false,
        error: result.error,
      });
    } else {
      // For pool supply errors, still show the calculation but mark as invalid
      // This happens when someone tries to withdraw more than exists in the pool
      setWithdrawEstimate({
        token0Amount: '0',
        token1Amount: '0',
        proportion: '0%',
        isValid: false,
        error: 'Amount exceeds available pool liquidity',
      });
    }
  }, [
    data?.pairPoolData,
    safeTokenInputs['pool.withdraw.lpToken']?.amount,
    safeTokenInputs['pool.withdraw.lpToken']?.balance,
    selectedPool,
  ]);

  // Track which field user is actively editing to avoid interfering with their input
  const previousValuesRef = useRef({ tokenA: '', tokenB: '' });
  const isCalculatingRef = useRef(false);

  const calculateRatio = useCallback(
    (sourceField: 'tokenA' | 'tokenB', amount: string) => {
      if (!data?.pairPoolData || !selectedPool || isCalculatingRef.current) {
        return;
      }

      const token0 = TOKENS.find((t) => t.symbol === selectedPool.token0);
      const token1 = TOKENS.find((t) => t.symbol === selectedPool.token1);

      if (!token0 || !token1) return;

      isCalculatingRef.current = true;

      const isTokenASource = sourceField === 'tokenA';
      const targetInputIdentifier = isTokenASource ? 'pool.deposit.tokenB' : 'pool.deposit.tokenA';

      try {
        const reserves = convertPoolReservesToFormat(
          data.pairPoolData,
          token0.address,
          token1.address
        );

        if (!reserves) {
          return;
        }

        const inputTokenAddress = isTokenASource ? token0.address : token1.address;

        const result = calculateProportionalAmount(amount, inputTokenAddress, reserves);

        // Check if pool has no liquidity
        const hasLiquidity = !reserves.token0.amount.isZero() && !reserves.token1.amount.isZero();

        if (!hasLiquidity) {
          // For pools with no liquidity, don't auto-calculate the other field
          // Users can provide any ratio for initial liquidity
          setValidationWarning(null);
          return;
        }

        // Only update the target field if it's not currently focused (being typed into)
        const targetInputElement = document.querySelector(
          `input[data-input-id="${targetInputIdentifier}"]`
        ) as HTMLInputElement;
        const isTargetFieldFocused =
          targetInputElement && document.activeElement === targetInputElement;

        if (!isTargetFieldFocused) {
          setTokenInputAmount(targetInputIdentifier, result.amount);
        }

        // Clear any existing validation warnings since we no longer check pool reserves
        // Users are only limited by their personal token balance, not pool reserves
        setValidationWarning(null);
      } catch (_error) {
        // Silent error handling
      } finally {
        setTimeout(() => {
          isCalculatingRef.current = false;
        }, 50);
      }
    },
    [data?.pairPoolData, selectedPool, setTokenInputAmount]
  );

  // Monitor changes and calculate ratios with better user input tracking
  useEffect(() => {
    if (isCalculatingRef.current) return;

    const tokenAAmount = safeTokenInputs['pool.deposit.tokenA']?.amount || '';
    const tokenBAmount = safeTokenInputs['pool.deposit.tokenB']?.amount || '';
    const previous = previousValuesRef.current;

    // Determine which field changed
    const tokenAChanged = tokenAAmount !== previous.tokenA;
    const tokenBChanged = tokenBAmount !== previous.tokenB;

    // Update previous values
    previousValuesRef.current = { tokenA: tokenAAmount, tokenB: tokenBAmount };

    // Helper to check if value is a valid number (including 0)
    const isValidNumber = (val: string) => {
      const trimmed = val.trim();
      if (!trimmed) return false;
      const num = parseFloat(trimmed);
      return !isNaN(num) && num >= 0;
    };

    // Calculate ratios when fields change
    if (tokenAChanged) {
      // Only calculate ratio if the input is a valid number and greater than 0
      if (isValidNumber(tokenAAmount) && parseFloat(tokenAAmount) > 0) {
        calculateRatio('tokenA', tokenAAmount);
      } else {
        // Clear validation warning when field is empty or 0
        setValidationWarning(null);
      }
    } else if (tokenBChanged) {
      // Only calculate ratio if the input is a valid number and greater than 0
      if (isValidNumber(tokenBAmount) && parseFloat(tokenBAmount) > 0) {
        calculateRatio('tokenB', tokenBAmount);
      } else {
        // Clear validation warning when field is empty or 0
        setValidationWarning(null);
      }
    }
  }, [
    safeTokenInputs['pool.deposit.tokenA']?.amount,
    safeTokenInputs['pool.deposit.tokenB']?.amount,
    calculateRatio,
  ]);

  const typedSelectedPool = (() => {
    if (selectedPool === undefined || selectedPool === null) return null;

    const token0 = TOKENS.find((t) => t.symbol === selectedPool.token0);
    const token1 = TOKENS.find((t) => t.symbol === selectedPool.token1);

    if (!token0 || !token1) return null;

    // Ensure all contract addresses match the secret1 format
    const isSecret1Address = (addr: string): addr is SecretString => addr.startsWith('secret1');

    const contractAddr = selectedPool.pairContract;
    const liquidityToken = selectedPool.lpToken;

    if (!isSecret1Address(contractAddr) || !isSecret1Address(liquidityToken)) return null;

    const pairInfo = LIQUIDITY_PAIRS.find((p) => p.pairContract === selectedPool.pairContract);

    if (!pairInfo) return null;

    const typedAssetInfos = [
      TOKENS.find((t) => t.symbol === pairInfo.token0),
      TOKENS.find((t) => t.symbol === pairInfo.token1),
    ].map((info) => {
      if (!info || !isSecret1Address(info.address)) return null;
      return {
        token: {
          contract_addr: info.address,
          token_code_hash: info.codeHash,
          viewing_key: '', // This should be handled properly, maybe from user's wallet
        },
      };
    });

    if (typedAssetInfos.some((info) => info === null)) return null;

    return {
      ...selectedPool,
      address: selectedPool.pairContract,
      token0: token0,
      token1: token1,
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
        token_code_hash: selectedPool.lpTokenCodeHash,
      },
    };
  })();

  return {
    tokenInputs: safeTokenInputs,
    setTokenInputAmount: (key: string, value: string) =>
      setTokenInputAmount(key as keyof typeof tokenInputs, value),
    setMax,
    selectedPool: typedSelectedPool as SelectedPoolType | null,
    loadingState,
    poolDetails: data?.poolDetails,
    pairPoolData: data?.pairPoolData,
    handleClick,
    withdrawEstimate,
    validationWarning,

    // Staking properties from usePoolStaking
    hasStakingRewards,
    stakingInfo,
    staking,
    autoStake,
    setAutoStake,
  };
}

// Add this function near other utility functions in the file
// Returns LP token amount in raw format (with decimals already applied)
function extractLpAmountFromTx(txResult: Record<string, unknown>): string | null {
  try {
    // Check multiple possible locations for transaction logs
    const arrayLog = Array.isArray(txResult.arrayLog)
      ? (txResult.arrayLog as unknown as unknown[])
      : [];
    const logs = Array.isArray(txResult.logs) ? (txResult.logs as unknown as unknown[]) : [];
    const events = Array.isArray(txResult.events) ? (txResult.events as unknown as unknown[]) : [];

    const allLogs = [...arrayLog, ...logs, ...events];

    if (allLogs.length === 0) {
      return null;
    }

    // Look through all logs for LP token mint/transfer events
    for (let i = 0; i < allLogs.length; i++) {
      const log = allLogs[i] as Record<string, unknown>;

      // Handle different log structures
      if (Array.isArray(log.events)) {
        // Handle events array structure
        for (const event of log.events) {
          const eventObj = event as Record<string, unknown>;
          if (eventObj.type === 'wasm') {
            const lpAmount = extractFromWasmEvent(eventObj);
            if (lpAmount) {
              return lpAmount;
            }
          }
        }
      }

      // Handle direct log structure
      if (log.type === 'wasm') {
        const lpAmount = extractFromWasmLog(log);
        if (lpAmount) {
          return lpAmount;
        }
      }

      // Handle direct log structure for share key (LP tokens)
      const logObj = log as unknown as Record<string, unknown>;
      if (logObj.type === 'wasm' && logObj.key === 'share') {
        return String(logObj.value);
      }
    }

    return null;
  } catch (_error) {
    return null;
  }
}

// Helper function to extract LP amount from wasm event
function extractFromWasmEvent(event: unknown): string | null {
  const eventObj = event as Record<string, unknown>;
  if (!eventObj.attributes || !Array.isArray(eventObj.attributes)) return null;

  for (const attr of eventObj.attributes as unknown as unknown[]) {
    const attrObj = attr as Record<string, unknown>;
    if (attrObj.key === 'mint' || attrObj.key === 'transfer') {
      // Look for amount in the same attribute or nearby attributes
      if (attrObj.value && typeof attrObj.value === 'string') {
        try {
          const parsed = JSON.parse(attrObj.value) as unknown;
          const parsedObj = parsed as Record<string, unknown>;
          if (parsedObj && typeof parsedObj.amount === 'string') {
            return parsedObj.amount;
          }
        } catch {
          // Not JSON, might be direct amount
          if (/^\d+$/.test(attrObj.value)) return attrObj.value;
        }
      }
    }

    // Direct amount attribute
    if (attrObj.key === 'amount' && attrObj.value && typeof attrObj.value === 'string') {
      if (/^\d+$/.test(attrObj.value)) return attrObj.value;
    }
  }

  return null;
}

// Helper function to extract LP amount from wasm log (legacy structure)
function extractFromWasmLog(log: unknown): string | null {
  const logObj = log as Record<string, unknown>;
  // Check for mint event
  if (logObj.key === 'mint' || logObj.key === 'transfer') {
    if (typeof logObj.value === 'object' && logObj.value !== null) {
      const valueObj = logObj.value as Record<string, unknown>;
      if ('amount' in valueObj && typeof valueObj['amount'] === 'string') {
        return valueObj['amount'];
      }
    }

    if (typeof logObj.value === 'string') {
      try {
        const parsed = JSON.parse(logObj.value) as Record<string, unknown>;
        if (parsed && 'amount' in parsed && typeof parsed['amount'] === 'string') {
          return parsed['amount'];
        }
      } catch {
        // Not JSON, might be direct amount
        if (/^\d+$/.test(logObj.value)) return logObj.value;
      }
    }
  }

  return null;
}
