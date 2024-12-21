import { usePoolStore } from '@/store/forms/poolStore';
import { useTxStore } from '@/store/txStore';
import { PoolTokenInputs, SecretString } from '@/types';
import { Asset, ContractInfo } from '@/types/secretswap/shared';
import { getApiTokenSymbol } from '@/utils/apis/getSwappableTokens';
import isNotNullish from '@/utils/isNotNullish';
import { getCodeHashByAddress } from '@/utils/secretjs/getCodeHashByAddress';
import { provideLiquidity } from '@/utils/secretjs/provideLiquidity';
import { withdrawLiquidity } from '@/utils/secretjs/withdrawLiquidity';
import { calculatePriceImpact, calculateTxFee } from '@/utils/swap';
import { Window } from '@keplr-wallet/types';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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

export function usePoolForm(poolAddress: string | string[] | undefined): UsePoolDepositFormResult {
  const { tokenInputs, selectedPool, setTokenInputAmount, setSelectedPool } = usePoolStore();

  // TODO: Find a way to have one secretjs client for the whole app.
  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { setPending, setResult } = useTxStore.getState();

  // TODO: Reduce this code duplication. The same effect is defined in the swap form.
  useEffect(() => {
    const keplr = (window as unknown as Window).keplr;
    const connectKeplr = async () => {
      if (!isNotNullish(keplr)) {
        alert('Please install Keplr extension');
        return;
      }

      await keplr.enable('secret-4');

      const offlineSigner = keplr.getOfflineSignerOnlyAmino('secret-4');
      const enigmaUtils = keplr.getEnigmaUtils('secret-4');
      const accounts = await offlineSigner?.getAccounts();

      if (accounts !== undefined && accounts.length === 0 && accounts[0] === undefined) {
        alert('No accounts found');
        return;
      }
      if (offlineSigner === undefined) {
        alert('No offline signer found');
        return;
      }

      const client = new SecretNetworkClient({
        chainId: 'secret-4',
        url: 'https://rpc.ankr.com/http/scrt_cosmos',
        wallet: offlineSigner,
        walletAddress: accounts[0]!.address,
        encryptionUtils: enigmaUtils,
      });

      setWalletAddress(accounts[0]!.address);
      setSecretjs(client);
    };

    void connectKeplr();
  }, []);

  async function getTokenBalance(
    secretjs: SecretNetworkClient,
    tokenAddress: string,
    tokenCodeHash: string
  ) {
    const keplr = (window as unknown as Window).keplr;
    if (!keplr) {
      alert('Please install the Keplr extension');
      return;
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

  useEffect(() => {
    if (!secretjs) return;

    const connectAndFetchBalances = async () => {
      try {
        const keplr = (window as unknown as Window).keplr;

        // TODO: probably don't want to use alerts
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

          // Handle the balances here as needed, such as updating state
          // setBalance0(balance0);
          // setBalance1(balance1);
        }
      } catch (error) {
        console.error('Error connecting or fetching balances:', error);
      }
    };

    void connectAndFetchBalances();
  }, [walletAddress, selectedPool]);

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

    const priceImpact = calculatePriceImpact(amount1);
    const txFee = calculateTxFee(amount1);

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
      priceImpact,
      txFee,
    });

    try {
      setPending(true);

      const result = await provideLiquidity(secretjs, pairContract, asset0, asset1);

      setPending(false);
      setResult(result);

      console.log('Transaction Result:', JSON.stringify(result, null, 4));

      if (result.code !== TxResultCode.Success) {
        throw new Error(`Swap failed: ${result.rawLog}`);
      }
    } catch (error) {
      console.error('Error during tx execution:', error);
      alert('Transaction failed. Check the console for more details.');
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
