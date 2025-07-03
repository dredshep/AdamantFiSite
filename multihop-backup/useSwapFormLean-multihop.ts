// This is the enhanced version of useSwapFormLean with multihop support
// Copy this back to hooks/useSwapFormLean.ts when ready to re-enable multihop

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
import { executeMultihopSwap, validateMultihopConfig } from './multihopExecution';
import { findMultihopPath, MultihopPath } from './routing';

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
  const [swapPath, setSwapPath] = useState<MultihopPath | null>(null);

  const { secretjs, walletAddress } = useKeplrConnection();
  const [estimatedOutput, setEstimatedOutput] = useState<string>('0');
  const { setPending } = useTxStore.getState();
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

  // Calculate multihop swap output
  async function calculateMultihopOutput(
    path: MultihopPath,
    inputAmount: Decimal
  ): Promise<{ output: Decimal; totalPriceImpact: string; totalFee: Decimal }> {
    let currentAmount = inputAmount;
    let totalPriceImpact = new Decimal(0);
    let totalFee = new Decimal(0);

    for (const hop of path.hops) {
      // Find the liquidity pair for this hop
      const hopFromToken = TOKENS.find((t) => t.address === hop.fromToken);
      const hopToToken = TOKENS.find((t) => t.address === hop.toToken);

      if (!hopFromToken || !hopToToken) {
        throw new Error(`Token not found for hop: ${hop.fromToken} -> ${hop.toToken}`);
      }

      const liquidityPair = findLiquidityPair(hopFromToken.symbol, hopToToken.symbol);
      if (!liquidityPair) {
        throw new Error(`No liquidity pair found for ${hopFromToken.symbol}/${hopToToken.symbol}`);
      }

      try {
        // Get pool data for this hop
        const poolData = await getPoolData(
          secretjs!,
          liquidityPair.pairContract,
          liquidityPair.pairContractCodeHash
        );

        // Calculate output for this hop
        const hopResult = calculateSingleHopOutput(
          currentAmount,
          poolData,
          hop.fromToken,
          hop.toToken
        );

        // Update running totals
        currentAmount = hopResult.output;
        totalPriceImpact = totalPriceImpact.add(hopResult.priceImpact);
        totalFee = totalFee.add(hopResult.lpFee);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Pool has no liquidity')) {
          // Preserve the original error message for consistent handling
          throw error;
        }
        throw error; // Re-throw other errors
      }
    }

    return {
      output: currentAmount,
      totalPriceImpact: totalPriceImpact.toFixed(2),
      totalFee,
    };
  }

  // Reset all estimation values to default
  function resetEstimationValues() {
    setEstimatedOutput('0');
    setPriceImpact('0');
    setPoolFee('0');
    setTxFee('0');
    setSwapPath(null);
  }

  // Reset routing path when starting new estimation
  function resetRoutingPath() {
    setSwapPath(null);
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

        console.log('=== Starting Estimation Process ===', {
          amount: estimationAmount,
          payToken: estimationPayToken,
          receiveToken: estimationReceiveToken,
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
        resetRoutingPath(); // Clear previous routing path when starting new estimation

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
            estimationAmount,
          });

          // Calculate the swap output using multihop routing
          const amountInDecimal = new Decimal(estimationAmount);
          const {
            output,
            totalPriceImpact: impact,
            totalFee: lpFee,
          } = await calculateMultihopOutput(routingPath, amountInDecimal);

          // Store the routing path for display and execution
          console.log('💾 Setting swapPath:', routingPath);
          setSwapPath(routingPath);

          // Update all the state values
          setEstimatedOutput(output.toFixed(6));
          setPriceImpact(impact);
          setPoolFee(lpFee.toFixed(6));
          setTxFee('0.025'); // Standard SCRT transaction fee
          setMinReceive(output.times(new Decimal(1).minus(slippage / 100)).toFixed(6));

          console.log('✅ Estimation completed successfully:', {
            output: output.toFixed(6),
            priceImpact: impact,
            poolFee: lpFee.toFixed(6),
            minReceive: output.times(new Decimal(1).minus(slippage / 100)).toFixed(6),
          });
        } catch (error) {
          console.error('❌ Estimation error:', error);

          // Handle specific error cases
          if (error instanceof Error) {
            if (error.message.includes('Pool has no liquidity')) {
              console.log('💧 Pool has no liquidity - setting N/A values');
              setEstimatedOutput('0');
              setPriceImpact('N/A');
              setPoolFee('N/A');
              setTxFee('N/A');
              setMinReceive('0');
              // Keep the routing path for display even if pool is empty
              const routingPath = findMultihopPath(payToken.address, receiveToken.address);
              setSwapPath(routingPath);
            } else if (error.message.includes('No routing path found')) {
              console.log('🚫 No routing path available');
              resetEstimationValues();
            } else {
              console.log('⚠️ Generic estimation error');
              resetEstimationValues();
            }
          } else {
            console.log('⚠️ Unknown estimation error');
            resetEstimationValues();
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

      runEstimate().catch((err) => {
        console.error('Error executing runEstimate:', err);
        setIsEstimating(false); // Ensure we exit estimating state on error
      });
    }, 300);

    // Cleanup function to cancel the timer if dependencies change
    return () => {
      clearTimeout(debounceTimer);
    };
  }, [payDetails.amount, payToken, receiveToken, secretjs, slippage, gas, refreshTrigger]);

  const handleSwapClick = async () => {
    const keplr = (window as unknown as Window).keplr;
    if (!isNotNullish(keplr)) {
      alert('Keplr extension not detected.');
      return;
    }

    if (payToken == null || receiveToken == null) {
      toast.error('Pay or receive token is undefined');
      return;
    }
    if (!secretjs) {
      console.error('SecretNetworkClient is not initialized');
      return;
    }

    // Use the current swap path for execution
    if (!swapPath) {
      console.error('No swap path available for execution', {
        payToken,
        receiveToken,
      });
      return;
    }

    try {
      setPending(true);

      // Use token decimals from the static config
      const decimalsIn = payToken.symbol === 'ETH.axl' ? 18 : 6;
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

      console.log(
        `Executing ${swapPath.isDirectPath ? 'direct' : 'multihop'} swap with ${
          swapPath.totalHops
        } hop(s)`
      );

      // Validate multihop configuration
      const configValidation = validateMultihopConfig();
      if (!configValidation.valid && !swapPath.isDirectPath) {
        console.warn('⚠️ Multihop not available, but this is a direct swap so proceeding');
        console.warn('Multihop validation errors:', configValidation.errors);
      }

      // Use the new multihop execution function
      const multihopResult = await executeMultihopSwap({
        client: secretjs,
        fromTokenAddress: payToken.address,
        toTokenAddress: receiveToken.address,
        amount: send_amount,
        minReceived: expected_return,
        path: swapPath,
        userAddress: walletAddress!,
      });

      setPending(false);

      if (!multihopResult.success) {
        throw new Error(multihopResult.error || 'Multihop swap failed');
      }

      console.log('Multihop swap results:', multihopResult);
      console.log(`✅ Multihop swap completed successfully!`);

      const swapType = multihopResult.debugInfo?.type || 'unknown';
      if (swapType === 'multihop') {
        alert('Multihop swap completed successfully via router contract!');
      } else {
        alert('Direct swap completed successfully!');
      }

      setEstimatedOutput('Swap completed successfully!');
    } catch (error) {
      console.error('Error during swap execution:', error);

      // Provide specific error messages for different cases
      if (error instanceof Error) {
        if (error.message.includes('no liquidity')) {
          alert(
            'Swap failed: One or more pools have no liquidity. Please try a different token pair.'
          );
          setEstimatedOutput('Pool has no liquidity');
        } else if (error.message.includes('No valid output expected')) {
          alert('Swap failed: Cannot execute swap due to insufficient liquidity.');
          setEstimatedOutput('Insufficient liquidity');
        } else {
          alert(`Swap failed: ${error.message}`);
          setEstimatedOutput('Error during swap execution. Please try again.');
        }
      } else {
        alert('Swap failed. Check the console for more details.');
        setEstimatedOutput('Error during swap execution. Please try again.');
      }

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
    swapPath,
  };
};
