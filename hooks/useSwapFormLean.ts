import { DIRECT_SWAP_FEE, MULTIHOP_SWAP_FEE_PER_HOP } from '@/config/fees';
import { ConfigToken, MULTIHOP_ENABLED, TOKENS } from '@/config/tokens';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { useSwapStore } from '@/store/swapStore';
import { useTxStore } from '@/store/txStore';
import { SecretString } from '@/types';
import isNotNullish from '@/utils/isNotNullish';
import { calculateMultihopOutput } from '@/utils/swap/multihopCalculation';
import { executeMultihopSwap, validateMultihopConfig } from '@/utils/swap/multihopExecution';
import { findMultihopPath, MultihopPath } from '@/utils/swap/routing';
import { showToastOnce, toastManager } from '@/utils/toast/toastManager';
import Decimal from 'decimal.js';
import { useEffect, useState } from 'react';

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
  // Enhanced state for multihop support
  const [swapPath, setSwapPath] = useState<MultihopPath | null>(null);
  const [hopPriceImpacts, setHopPriceImpacts] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { secretjs, walletAddress } = useKeplrConnection();
  const [estimatedOutput, setEstimatedOutput] = useState<string>('0');
  const { setPending, setResult } = useTxStore.getState();
  const [isEstimating, setIsEstimating] = useState(false);

  // Find token details from config
  function findToken(address: SecretString | undefined): ConfigToken | undefined {
    if (address == null) return undefined;
    return TOKENS.find((t) => t.address === address);
  }

  // Reset all estimation values to default
  function resetEstimationValues() {
    setEstimatedOutput('0');
    setPriceImpact('0');
    setPoolFee('0');
    setTxFee('0');
    setMinReceive('0');
    setSwapPath(null);
    setHopPriceImpacts([]);
  }

  function resetAndSetIsEstimating(isEstimating: boolean) {
    resetEstimationValues();
    setIsEstimating(isEstimating);
  }

  // Update the estimation effect with debouncing and race condition protection
  useEffect(() => {
    // Debounce the estimation - wait 300ms after user stops typing
    const debounceTimer = setTimeout(() => {
      const runEstimate = async () => {
        // Capture the current amount at the start of estimation
        const estimationAmount = payDetails.amount;
        const estimationPayToken = payToken?.symbol;
        const estimationReceiveToken = receiveToken?.symbol;

        // Enhanced estimation process debug logging removed

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
          // Estimation failed logging removed
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
          // Find the optimal routing path using multihop routing
          console.log('🔍 Finding routing path for:', {
            from: payToken.address,
            to: receiveToken.address,
            fromSymbol: payToken.symbol,
            toSymbol: receiveToken.symbol,
          });

          const routingPath = findMultihopPath(payToken.address, receiveToken.address);

          console.log('🔗 Routing path result:', routingPath);

          if (!routingPath) {
            console.log('❌ Estimation failed: No routing path found for these tokens', {
              payToken,
              receiveToken,
            });
            resetAndSetIsEstimating(false);
            return;
          }

          console.log(`✅ Using routing path:`, {
            payTokenSymbol: payToken.symbol,
            receiveTokenSymbol: receiveToken.symbol,
            path: routingPath,
            isDirectPath: routingPath.isDirectPath,
            totalHops: routingPath.totalHops,
            estimationAmount,
          });

          // Calculate the swap output using enhanced multihop calculation
          const amountInDecimal = new Decimal(estimationAmount);
          const {
            output,
            totalPriceImpact: impact,
            totalFee: lpFee,
          } = await calculateMultihopOutput(secretjs, routingPath, amountInDecimal);

          // CRITICAL: Only update state if the form values haven't changed since we started
          const currentAmount = payDetails.amount;
          const currentPayToken = payToken?.symbol;
          const currentReceiveToken = receiveToken?.symbol;

          if (
            currentAmount === estimationAmount &&
            currentPayToken === estimationPayToken &&
            currentReceiveToken === estimationReceiveToken
          ) {
            console.log('✅ Enhanced estimation complete and still current:', {
              estimationAmount,
              currentAmount,
              output: output.toFixed(6),
              isDirectPath: routingPath.isDirectPath,
              totalHops: routingPath.totalHops,
            });

            // Store the routing path for display and execution
            setSwapPath(routingPath);

            // Set the calculated values
            setEstimatedOutput(output.toFixed(6));
            setPriceImpact(impact);
            setPoolFee(lpFee.toFixed(6));

            // Calculate transaction fee based on swap type
            const txFeeInScrt = routingPath.isDirectPath
              ? DIRECT_SWAP_FEE
              : MULTIHOP_SWAP_FEE_PER_HOP * routingPath.totalHops;
            setTxFee(parseFloat(txFeeInScrt.toFixed(6)).toString());

            // Calculate min receive based on output and slippage
            const minReceiveAmount = output.mul(new Decimal(1).sub(slippage / 100)).toFixed(6);
            setMinReceive(minReceiveAmount);

            // TODO: Calculate per-hop price impacts for enhanced UI
            // This would require extending calculateMultihopOutput to return per-hop data
            setHopPriceImpacts([]);
          } else {
            console.log('🚫 Enhanced estimation outdated, ignoring result:', {
              estimationAmount,
              currentAmount,
              estimationPayToken,
              currentPayToken,
              estimationReceiveToken,
              currentReceiveToken,
            });
          }

          // Need to add an await to satisfy the linter
          await Promise.resolve();
        } catch (error) {
          console.error('❌ Error during enhanced estimation:', error);

          // Only update state if the form values haven't changed since we started
          const currentAmount = payDetails.amount;
          const currentPayToken = payToken?.symbol;
          const currentReceiveToken = receiveToken?.symbol;

          if (
            currentAmount === estimationAmount &&
            currentPayToken === estimationPayToken &&
            currentReceiveToken === estimationReceiveToken
          ) {
            // Check if it's a no liquidity error and provide specific feedback
            if (error instanceof Error && error.message.includes('no liquidity')) {
              console.log('💧 Pool has no liquidity - setting appropriate values');
              setEstimatedOutput('0');
              setPriceImpact('N/A');
              setPoolFee('0');
              setTxFee('0');
              setMinReceive('0');
              // Keep the routing path for display even if pool is empty
              const routingPath = findMultihopPath(payToken.address, receiveToken.address);
              setSwapPath(routingPath);
            } else {
              resetEstimationValues();
            }
          }
        } finally {
          // Only reset isEstimating if this is still the latest request
          const currentAmount = payDetails.amount;
          const currentPayToken = payToken?.symbol;
          const currentReceiveToken = receiveToken?.symbol;

          if (
            currentAmount === estimationAmount &&
            currentPayToken === estimationPayToken &&
            currentReceiveToken === estimationReceiveToken
          ) {
            setIsEstimating(false);
          }
        }
      };

      void runEstimate();
    }, 300); // 300ms debounce delay

    // Cleanup function to cancel the timer if dependencies change
    return () => {
      clearTimeout(debounceTimer);
    };
  }, [payDetails.amount, payToken, receiveToken, secretjs, slippage, gas, refreshTrigger]);

  const handleSwapClick = async () => {
    const keplr = (window as unknown as Window).keplr;
    if (!isNotNullish(keplr)) {
      toastManager.keplrNotInstalled();
      return;
    }
    showDebugAlert();
    if (payToken == null || receiveToken == null) {
      showToastOnce('pay-receive-undefined', 'Pay or receive token is undefined', 'error');
      return;
    }
    if (!secretjs) {
      console.error('SecretNetworkClient is not initialized');
      showToastOnce('secretjs-not-init', 'SecretJS is not initialized. Please refresh.', 'error');
      return;
    }

    // Use the current swap path for execution
    if (!swapPath) {
      showToastOnce('no-swap-path', 'No swap path available for execution', 'error');
      console.error('No swap path available for execution', {
        payToken,
        receiveToken,
      });
      return;
    }

    try {
      // User only needs a viewing key for the token they are sending.
      // const inputViewingKey = getViewingKey(payToken.address);

      // if (!inputViewingKey) {
      //   toastManager.viewingKeyRequired();
      //   return;
      // }

      // Validate multihop configuration
      const validation = validateMultihopConfig();
      if (!validation.valid) {
        console.error('❌ Multihop configuration validation failed:', validation.errors);
        validation.errors.forEach((error) =>
          showToastOnce(`multihop-validation-${error}`, error, 'error')
        );
        return;
      }

      // Ensure wallet address is available
      if (!walletAddress) {
        showToastOnce(
          'wallet-not-connected',
          'Wallet address is not available. Please connect your wallet.',
          'error'
        );
        return;
      }

      // Execute the swap using the current routing path
      const multihopParams = {
        client: secretjs,
        fromTokenAddress: payToken.address,
        toTokenAddress: receiveToken.address,
        amount: payDetails.amount,
        minReceived: minReceive,
        path: swapPath,
        userAddress: walletAddress, // Now guaranteed to be non-null
      };

      console.log('🚀 Executing swap with params:', multihopParams);

      // Check if multihop is enabled and available
      if (!MULTIHOP_ENABLED) {
        showToastOnce(
          'multihop-disabled',
          'Multihop functionality is not available. Please use direct token pairs.',
          'error'
        );
        return;
      }

      setPending(true);
      const multihopResult = await executeMultihopSwap(multihopParams);

      // Log the raw contract return for multihop swaps
      if (!swapPath.isDirectPath) {
        console.log('🔍 Multihop Contract Return:', JSON.stringify(multihopResult, null, 2));
      }

      // Handle successful swap result
      if (multihopResult.success) {
        // Only show success toast after confirming the swap succeeded
        if (swapPath.isDirectPath) {
          showToastOnce('direct-swap-success', 'Direct swap completed successfully!', 'success');
        } else {
          showToastOnce(
            'multihop-swap-success',
            'Multihop swap completed successfully via router contract!',
            'success'
          );
        }

        // Check if txResponse exists and is valid
        if ('txResponse' in multihopResult && multihopResult.txResponse) {
          setResult(multihopResult.txResponse);
        } else {
          console.log('✅ Swap successful but no txResponse available');
        }
      } else {
        console.error('❌ Swap failed:', multihopResult.error);
        throw new Error(multihopResult.error || 'Swap execution failed');
      }
    } catch (error) {
      console.error('Error during swap execution:', error);

      // Provide specific error messages for different cases
      if (error instanceof Error) {
        if (error.message.includes('no liquidity')) {
          showToastOnce(
            'swap-no-liquidity',
            'Swap failed: One or more pools have no liquidity.',
            'error',
            { message: 'Please try a different token pair.' }
          );
        } else if (error.message.includes('insufficient')) {
          showToastOnce(
            'swap-insufficient-liquidity',
            'Swap failed: Cannot execute swap due to insufficient liquidity.',
            'error'
          );
        } else {
          showToastOnce('swap-failed-generic', `Swap failed: ${error.message}`, 'error');
        }
      } else {
        console.error('Unknown error:', error);
        showToastOnce(
          'swap-failed-unknown',
          'Swap failed. Check the console for more details.',
          'error'
        );
      }
    } finally {
      setPending(false);
    }
  };

  // Function to swap the positions of pay and receive tokens
  const swapTokens = () => {
    const { setTokenInputProperty } = useSwapStore.getState();

    // Get current token addresses
    const currentPayAddress = payDetails.tokenAddress;
    const currentReceiveAddress = receiveDetails.tokenAddress;

    // Get the current estimated output to use as the new input amount
    const currentEstimatedOutput = estimatedOutput;

    // Swap the token addresses
    setTokenInputProperty('swap.pay', 'tokenAddress', currentReceiveAddress);
    setTokenInputProperty('swap.receive', 'tokenAddress', currentPayAddress);

    // Set the estimated output as the new input amount (if we have a valid estimation)
    if (
      currentEstimatedOutput &&
      currentEstimatedOutput !== '0' &&
      !isNaN(parseFloat(currentEstimatedOutput))
    ) {
      setTokenInputProperty('swap.pay', 'amount', currentEstimatedOutput);
    } else {
      // Fallback to clearing if no valid estimation
      setTokenInputProperty('swap.pay', 'amount', '');
    }

    // Clear the receive amount - it will be recalculated by the estimation effect
    setTokenInputProperty('swap.receive', 'amount', '');
  };

  const showDebugAlert = () => {
    if (payToken == null || receiveToken == null) {
      showToastOnce('pay-receive-undefined-debug', 'Pay or receive token is undefined', 'error');
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
    // Enhanced multihop properties
    swapPath,
    hopPriceImpacts,
  };
};
