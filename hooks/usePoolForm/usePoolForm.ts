import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { usePoolStore } from '@/store/forms/poolStore';
import { useTxStore } from '@/store/txStore';
import { PoolTokenInputs, SecretString } from '@/types';
import { Asset, ContractInfo } from '@/types/secretswap/shared';
import { getApiTokenSymbol } from '@/utils/apis/getSwappableTokens';
import isNotNullish from '@/utils/isNotNullish';
import { provideLiquidity } from '@/utils/secretjs/pools/provideLiquidity';
import { withdrawLiquidity } from '@/utils/secretjs/pools/withdrawLiquidity';
import { getCodeHashByAddress } from '@/utils/secretjs/tokens/getCodeHashByAddress';
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

export function usePoolForm(poolAddress: string | string[] | undefined): UsePoolDepositFormResult {
  const { tokenInputs, selectedPool, setTokenInputAmount, setSelectedPool } = usePoolStore();
  const { secretjs, walletAddress } = useKeplrConnection();
  const { setPending, setResult } = useTxStore.getState();

  const initialMountRef = useRef(true);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  async function getTokenBalance(
    secretjs: SecretNetworkClient,
    tokenAddress: string,
    tokenCodeHash: string
  ): Promise<{ balance: { amount: string } } | null> {
    const keplr = (window as unknown as Window).keplr;
    if (!isNotNullish(keplr)) {
      toast.error('Please install the Keplr extension');
      return null;
    }

    try {
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

      return balance;
    } catch (error) {
      console.error('Error getting token balance:', error);
      return null;
    }
  }

  // @ts-expect-error: Not all code paths return a value.
  useEffect(() => {
    if (!secretjs) return;

    // Skip the first mount and wait 2 seconds
    if (initialMountRef.current) {
      initialMountRef.current = false;
      const timer = setTimeout(() => {
        setIsBalanceLoading(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (!isBalanceLoading) return;

    const connectAndFetchBalances = debounce(async () => {
      try {
        const keplr = (window as unknown as Window).keplr;

        if (!keplr) {
          alert('Please install the Keplr extension');
          return;
        }

        if (walletAddress !== null && walletAddress !== undefined && walletAddress !== '') {
          console.log('Wallet address changed:', walletAddress);

          const token0Address = selectedPool?.token0?.address;
          const token1Address = selectedPool?.token1?.address;

          if (token0Address === undefined || token1Address === undefined) {
            console.error('Token address is undefined');
            return;
          }

          const [balance0, balance1] = await Promise.all([
            getTokenBalance(secretjs, token0Address, getCodeHashByAddress(token0Address)),
            getTokenBalance(secretjs, token1Address, getCodeHashByAddress(token1Address)),
          ]);

          console.log('Balance of token0:', balance0);
          console.log('Balance of token1:', balance1);
        }
      } catch (error) {
        console.error('Error connecting or fetching balances:', error);
      }
    }, 1000);

    void connectAndFetchBalances();
  }, [walletAddress, selectedPool, secretjs, isBalanceLoading]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['pool-data', poolAddress],
    queryFn: async () => {
      const validPoolAddress = validatePoolAddress(poolAddress);
      return await fetchPoolData(validPoolAddress, (pool: SelectedPoolType) => {
        setSelectedPool({
          address: pool.address,
          token0: pool.token0,
          token1: pool.token1,
          pairInfo: {
            ...pool.pairInfo,
            liquidity_token: '' as SecretString,
            token_code_hash: '',
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

    // TODO: Map pair address to code_hash. They will all be the same for now.
    const pairContract: ContractInfo = {
      address: selectedPool.address,
      code_hash: '0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490',
    };

    const asset0: Asset = {
      info: {
        token: {
          contract_addr: address0,
          token_code_hash: getCodeHashByAddress(address0),
          viewing_key: 'SecretSwap',
        },
      },
      amount: convertAmount(amount0, selectedPool.token0.decimals),
    };

    const asset1: Asset = {
      info: {
        token: {
          contract_addr: address1,
          token_code_hash: getCodeHashByAddress(address1),
          viewing_key: 'SecretSwap',
        },
      },
      amount: convertAmount(amount1, selectedPool.token1.decimals),
    };

    console.log('Deposit clicked', {
      pool: selectedPool.address,
      token0: getApiTokenSymbol(selectedPool.token0),
      amount0,
      token1: getApiTokenSymbol(selectedPool.token1),
      amount1,
      poolShare: metrics.poolShare,
      ratioDeviation: metrics.ratioDeviation,
      txFee: metrics.txFee,
    });

    try {
      setPending(true);

      const result = await provideLiquidity(secretjs, pairContract, asset0, asset1);

      setPending(false);
      setResult(result);

      console.log('Transaction Result:', JSON.stringify(result, null, 4));

      if (result.code !== TxResultCode.Success) {
        throw new Error(`Deposit failed: ${result.rawLog}`);
      }
    } catch (error) {
      console.error('Error during tx execution:', error);
      toast.error('Transaction failed. Check the console for more details.');
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

    // TODO: Map pair address to code_hash. They will all be the same for now.
    const pairContract: ContractInfo = {
      address: selectedPool.address,
      code_hash: '0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490',
    };

    // FIXME: the selectedPool.pairInfo.token_code_hash is wrong.
    // For some reason it is set to
    // 0DFD06C7C3C482C14D36BA9826B83D164003F2B0BB302F222DB72361E0927490
    // which is the pair contract code hash.
    // The factory '{"pairs":{}}' query returns the wrong token_code_hash,
    // but the pair contract '{"pair":{}}' query returns the correct one...
    //
    // console.debug('Selected Pool:', JSON.stringify(selectedPool, null, 4));

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
    } catch (error) {
      console.error('Error during tx execution:', error);
      alert('Transaction failed. Check the console for more details.');
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
    if (lpAmount === undefined || parseFloat(lpAmount) === 0) {
      setWithdrawEstimate(null);
      return;
    }

    const { assets, total_share } = data.pairPoolData;
    if (!Array.isArray(assets) || assets.length !== 2 || total_share === undefined) {
      return;
    }

    // Add validation for zero values
    if (total_share === '0') {
      console.log('Pool has no liquidity');
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

    // Calculate proportion of pool
    const proportion = parseFloat(lpAmount) / parseFloat(total_share);

    // Validate the proportion calculation
    if (!isFinite(proportion) || isNaN(proportion)) {
      console.log('Invalid proportion calculation');
      setWithdrawEstimate({
        token0Amount: '0',
        token1Amount: '0',
      });
      return;
    }

    // Calculate expected amounts
    const token0Amount = (parseFloat(asset0Amount) * proportion).toFixed(6);
    const token1Amount = (parseFloat(asset1Amount) * proportion).toFixed(6);

    // Validate final amounts
    if (isNaN(parseFloat(token0Amount)) || isNaN(parseFloat(token1Amount))) {
      setWithdrawEstimate({
        token0Amount: '0',
        token1Amount: '0',
      });
      return;
    }

    setWithdrawEstimate({
      token0Amount,
      token1Amount,
    });
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
  };
}
