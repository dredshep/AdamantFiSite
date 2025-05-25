import { ConfigToken, LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { useSwapStore } from '@/store/swapStore';
import { useTxStore } from '@/store/txStore';
import { SecretString } from '@/types';
import { calculateSingleHopOutput } from '@/utils/estimation/calculateSingleHopOutput';
import { getPoolData } from '@/utils/estimation/getPoolData';
import isNotNullish from '@/utils/isNotNullish';
import Decimal from 'decimal.js';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { TxOptions, TxResultCode } from 'secretjs';
import { Snip20SendOptions } from 'secretjs/dist/extensions/snip20/types';

export const useSwapFormLean = () => {
  const { swapTokenInputs: tokenInputs } = useSwapStore();
  const payDetails = tokenInputs['swap.pay'];
  const receiveDetails = tokenInputs['swap.receive'];

  // Get token data directly from the config instead of token store
  const payToken = findToken(payDetails.tokenAddress);
  const receiveToken = findToken(receiveDetails.tokenAddress);

  const slippage = useSwapStore((state) => state.sharedSettings.slippage);
  const setSlippage = useSwapStore((state) => state.setSlippage);
  const gas = useSwapStore((state) => state.sharedSettings.gas);

  const [priceImpact, setPriceImpact] = useState('0');
  const [poolFee, setPoolFee] = useState('0');
  const [txFee, setTxFee] = useState('0');
  const [minReceive, setMinReceive] = useState('0');

  const { secretjs, walletAddress } = useKeplrConnection();
  const [estimatedOutput, setEstimatedOutput] = useState<string>('0');
  const { setPending, setResult } = useTxStore.getState();
  const [isEstimating, setIsEstimating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Find token details from config
  function findToken(address: SecretString | undefined): ConfigToken | undefined {
    if (address == null) return undefined;
    return TOKENS.find((t) => t.address === address);
  }

  // Find liquidity pair from config
  function findLiquidityPair(token0Symbol: string, token1Symbol: string) {
    return LIQUIDITY_PAIRS.find(
      (pair) =>
        (pair.token0 === token0Symbol && pair.token1 === token1Symbol) ||
        (pair.token0 === token1Symbol && pair.token1 === token0Symbol)
    );
  }

  // Reset all estimation values to default
  function resetEstimationValues() {
    setEstimatedOutput('0');
    setPriceImpact('0');
    setPoolFee('0');
    setTxFee('0');
  }

  function resetAndSetIsEstimating(isEstimating: boolean) {
    resetEstimationValues();
    setIsEstimating(isEstimating);
  }

  // Update the estimation effect
  useEffect(() => {
    const runEstimate = async () => {
      console.log('=== Starting Estimation Process ===');
      console.log('Current conditions:', {
        hasSecretJs: !!secretjs,
        payAmount: payDetails.amount,
        payTokenSymbol: payToken?.symbol,
        receiveTokenSymbol: receiveToken?.symbol,
      });

      // Set default "0" when conditions aren't met
      if (!secretjs) {
        console.log('❌ Estimation failed: secretjs not initialized');
        resetAndSetIsEstimating(false);
        return;
      }

      if (
        typeof payDetails.amount !== 'string' ||
        payDetails.amount === '' ||
        payDetails.amount === '0'
      ) {
        console.log('❌ Estimation failed: no pay amount or amount is zero');
        resetAndSetIsEstimating(false);
        return;
      }

      const amount = parseFloat(payDetails.amount);
      if (isNaN(amount) || amount <= 0) {
        console.log('❌ Estimation failed: pay amount is invalid or less than or equal to zero');
        resetAndSetIsEstimating(false);
        return;
      }

      if (payToken == null || receiveToken == null) {
        console.log('❌ Estimation failed: tokens not properly initialized');
        resetAndSetIsEstimating(false);
        return;
      }

      setIsEstimating(true);

      try {
        // Find the matching liquidity pair from config
        const liquidityPair = findLiquidityPair(payToken.symbol, receiveToken.symbol);

        if (!liquidityPair) {
          console.log('❌ Estimation failed: No liquidity pair found for these tokens', {
            payToken,
            receiveToken,
          });
          resetAndSetIsEstimating(false);
          return;
        }

        const poolAddress = liquidityPair.pairContract;
        const codeHash = liquidityPair.pairContractCodeHash;

        console.log(`🔗 Using liquidity pair:`, {
          payTokenSymbol: payToken.symbol,
          receiveTokenSymbol: receiveToken.symbol,
          poolAddress,
          codeHash,
          liquidityPair,
        });

        // Get the actual pool data from the blockchain
        const poolData = await getPoolData(secretjs, poolAddress, codeHash);

        // Calculate the swap output using the actual pool data
        const amountInDecimal = new Decimal(payDetails.amount);
        const {
          output,
          priceImpact: impact,
          lpFee,
        } = calculateSingleHopOutput(
          amountInDecimal,
          poolData,
          payToken.address,
          receiveToken.address
        );

        // Set the calculated values
        setEstimatedOutput(output.toFixed(6));
        setPriceImpact(impact);
        setPoolFee(lpFee.toFixed(6));

        // Calculate transaction fee based on gas settings
        // Default gas price if not set or if gas is 0
        const gasPrice = gas;
        const gasLimit = 500_000; // Standard gas limit for swaps
        const txFeeInUscrt = gasPrice * gasLimit;
        const txFeeInScrt = txFeeInUscrt / 1_000_000; // Convert from uscrt to SCRT
        setTxFee(txFeeInScrt.toFixed(6));

        // Calculate min receive based on output and slippage
        const minReceiveAmount = output.mul(new Decimal(1).sub(slippage / 100)).toFixed(6);
        setMinReceive(minReceiveAmount);

        // Need to add an await to satisfy the linter
        await Promise.resolve();
      } catch (error) {
        console.error('❌ Error during estimation:', error);

        // Check if it's a no liquidity error and provide specific feedback
        if (error instanceof Error && error.message.includes('no liquidity')) {
          console.log('💧 Pool has no liquidity - setting appropriate values');
          setEstimatedOutput('0');
          setPriceImpact('N/A');
          setPoolFee('0');
          setTxFee('0');
          setMinReceive('0');
        } else {
          resetEstimationValues();
        }
      } finally {
        setIsEstimating(false);
      }
    };

    void runEstimate();
  }, [payDetails.amount, payToken, receiveToken, secretjs, slippage, gas, refreshTrigger]);

  const handleSwapClick = async () => {
    const keplr = (window as unknown as Window).keplr;
    if (!isNotNullish(keplr)) {
      alert('Keplr extension not detected.');
      return;
    }
    showDebugAlert();
    if (payToken == null || receiveToken == null) {
      toast.error('Pay or receive token is undefined');
      return;
    }
    if (!secretjs) {
      console.error('SecretNetworkClient is not initialized');
      return;
    }

    // Find the liquidity pair
    const liquidityPair = findLiquidityPair(payToken.symbol, receiveToken.symbol);

    if (!liquidityPair) {
      console.error('No liquidity pair found for these tokens', {
        payToken,
        receiveToken,
      });
      return;
    }

    try {
      // Assert the address is in the correct format for Keplr
      const inputViewingKey = await keplr.getSecret20ViewingKey(
        'secret-4',
        // The as cast is safe here because we've verified the token exists
        payToken.address
      );
      const outputViewingKey = await keplr.getSecret20ViewingKey(
        'secret-4',
        // The as cast is safe here because we've verified the token exists
        receiveToken.address
      );

      if (inputViewingKey === undefined || outputViewingKey === undefined) {
        alert('Viewing keys are missing. Please create them before swapping.');
        return;
      }

      setPending(true);

      // Fetch the account information to get the sequence number and account number
      const accountInfo = await secretjs.query.auth.account({
        address: walletAddress!,
      });

      const baseAccount = accountInfo as {
        '@type': '/cosmos.auth.v1beta1.BaseAccount';
        sequence?: string;
        account_number?: string;
      };

      // Check if sequence number is available
      const sequence = isNotNullish(baseAccount.sequence)
        ? parseInt(baseAccount.sequence, 10)
        : null;
      const accountNumber = isNotNullish(baseAccount.account_number)
        ? parseInt(baseAccount.account_number, 10)
        : null;

      const txOptions: TxOptions = {
        gasLimit: 500_000,
        gasPriceInFeeDenom: gas, // Use gas from store or default to 0.25
        feeDenom: 'uscrt',
        // Only include explicitSignerData if both sequence and accountNumber are available
        ...(sequence !== null && accountNumber !== null
          ? {
              explicitSignerData: {
                accountNumber: accountNumber,
                sequence: sequence,
                chainId: 'secret-4',
              },
            }
          : {}),
      };

      // Use token decimals from the static config (default to 6 if not found)
      const decimalsIn = payToken.symbol === 'ETH.axl' ? 18 : 6; // ETH uses 18 decimals, others use 6
      const decimalsOut = receiveToken.symbol === 'ETH.axl' ? 18 : 6;

      const send_amount = new Decimal(payDetails.amount)
        .times(Decimal.pow(10, decimalsIn))
        .toFixed(0);

      // Calculate expected return with slippage
      let expected_return = new Decimal(estimatedOutput)
        .times(new Decimal(1).minus(slippage / 100))
        .times(Decimal.pow(10, decimalsOut))
        .toFixed(0);

      // Make sure even low value trade won't lose funds
      if (new Decimal(expected_return).lt(1)) {
        expected_return = '1';
      }
      console.log('Expected Return:', expected_return);

      // Always use direct swap since we know all the pairs from the config
      console.log('Single hop. Using Pair contract directly.');

      const poolAddress = liquidityPair.pairContract;
      const inputTokenAddress = payToken.address;
      const outputTokenAddress = receiveToken.address;

      console.log(`Executing swap on pool ${poolAddress}`);
      console.log(`Swapping ${inputTokenAddress} for ${outputTokenAddress}`);

      const swapMsg = {
        swap: {
          expected_return: expected_return,
          to: walletAddress,
        },
      };

      const sendMsg: Snip20SendOptions = {
        send: {
          recipient: poolAddress,
          amount: send_amount,
          msg: btoa(JSON.stringify(swapMsg)),
        },
      };

      console.log('Swapping with message:', JSON.stringify(sendMsg, null, 2));
      console.log('Callback message:', JSON.stringify(swapMsg, null, 2));

      // gasLimit for single swap
      txOptions.gasLimit = 500_000;

      const result = await secretjs.tx.snip20.send(
        {
          sender: walletAddress!,
          contract_address: inputTokenAddress,
          code_hash: payToken.codeHash,
          msg: sendMsg,
          sent_funds: [],
        },
        txOptions
      );

      setPending(false);
      setResult(result);

      console.log('Transaction Result:', result);

      if (result.code !== TxResultCode.Success) {
        throw new Error(`Swap failed: ${result.rawLog}`);
      }

      console.log(`Swap executed successfully!`);
      alert('Swap completed successfully!');
      setEstimatedOutput('Swap completed successfully!');
    } catch (error) {
      console.error('Error during swap execution:', error);
      alert('Swap failed. Check the console for more details.');
      setEstimatedOutput('Error during swap execution. Please try again.');
      setPending(false);
    }
  };

  // Function to swap the positions of pay and receive tokens
  const swapTokens = () => {
    const { setTokenInputProperty } = useSwapStore.getState();

    // Get current token addresses
    const currentPayAddress = payDetails.tokenAddress;
    const currentReceiveAddress = receiveDetails.tokenAddress;

    // Swap the token addresses
    setTokenInputProperty('swap.pay', 'tokenAddress', currentReceiveAddress);
    setTokenInputProperty('swap.receive', 'tokenAddress', currentPayAddress);

    // Clear the amounts when swapping
    setTokenInputProperty('swap.pay', 'amount', '');
    setTokenInputProperty('swap.receive', 'amount', '');
  };

  const showDebugAlert = () => {
    if (payToken == null || receiveToken == null) {
      toast.error('Pay or receive token is undefined');
      return;
    }

    const alertMessage = `Swapping Details:
    
Pay Token: ${payToken.symbol}
Pay Amount: ${payDetails.amount}

Receive Token: ${receiveToken.symbol}
Receive Amount: ${receiveDetails.amount}

Slippage: ${slippage}
Gas: ${gas}

Price Impact: ${priceImpact}% = ${(
      (parseFloat(priceImpact) / 100) *
      parseFloat(payDetails.amount)
    ).toFixed(4)} ${payToken.symbol}
TX Fee: ${txFee} ${payToken.symbol} = ${(
      (parseFloat(txFee) / parseFloat(payDetails.amount)) *
      100
    ).toFixed(2)}%
Min Receive: ${minReceive} ${receiveToken.symbol}

RawData: ${JSON.stringify(
      {
        payToken,
        payDetails,
        receiveToken,
        receiveDetails,
        slippage,
        gas,
        priceImpact,
        txFee,
        minReceive,
      },
      null,
      2
    )}`;

    console.log({ alertMessage });
  };

  // Function to manually refresh the estimation
  const refreshEstimation = () => {
    console.log('🔄 Manually refreshing estimation...');
    setRefreshTrigger((prev) => prev + 1);
  };

  return {
    payDetails,
    payToken,
    receiveDetails,
    receiveToken,
    slippage,
    setSlippage,
    gas,
    priceImpact,
    poolFee,
    txFee,
    minReceive,
    estimatedOutput,
    isEstimating,
    handleSwapClick,
    swapTokens,
    refreshEstimation,
  };
};
