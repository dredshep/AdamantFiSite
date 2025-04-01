import { fullPoolsData } from '@/components/app/Testing/fullPoolsData';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { useSwapStore } from '@/store/swapStore';
import { useTokenStore } from '@/store/tokenStore';
import { useTxStore } from '@/store/txStore';
import { Hop } from '@/types';
import { ApiToken, getApiTokenAddress, getApiTokenSymbol } from '@/utils/apis/getSwappableTokens';
import { getTokenDecimals } from '@/utils/apis/tokenInfo';
import isNotNullish from '@/utils/isNotNullish';
import { getCodeHashByAddress } from '@/utils/secretjs/tokens/getCodeHashByAddress';
import { fetchSwappableTokens } from '@/utils/swap';
import {
  PathEstimation,
  buildTokenPoolMap,
  estimateBestPath,
  findPaths,
} from '@/utils/swap/estimate';
import { estimateSwapOutput } from '@/utils/swap/poolEstimation';
import Decimal from 'decimal.js';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { TxOptions, TxResponse, TxResultCode } from 'secretjs';
import { Snip20SendOptions } from 'secretjs/dist/extensions/snip20/types';

export const useSwapForm = () => {
  const [swappableTokens, setSwappableTokens] = useState<ApiToken[]>([]);
  const { swapTokenInputs: tokenInputs } = useSwapStore();
  const payDetails = tokenInputs['swap.pay'];
  const payToken = useTokenStore((state) => state.tokens?.[payDetails.tokenAddress]);
  const receiveDetails = tokenInputs['swap.receive'];
  const receiveToken = useTokenStore((state) => state.tokens?.[receiveDetails.tokenAddress]);
  const slippage = useSwapStore((state) => state.sharedSettings.slippage);
  const setSlippage = useSwapStore((state) => state.setSlippage);
  const gas = useSwapStore((state) => state.sharedSettings.gas);

  const [priceImpact, setPriceImpact] = useState('0');
  const [poolFee, setPoolFee] = useState('0');
  const [txFee, setTxFee] = useState('0');
  const [minReceive, setMinReceive] = useState('0');

  // Replace the old Keplr connection state and effect with the hook
  const { secretjs, walletAddress } = useKeplrConnection();
  const [bestPathEstimation, setBestPathEstimation] = useState<PathEstimation | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState<string>('0');
  const { setPending, setResult } = useTxStore.getState();
  const [isEstimating, setIsEstimating] = useState(false);

  useEffect(() => {
    void fetchSwappableTokens().then(setSwappableTokens);
  }, []);

  // Update the estimation effect
  useEffect(() => {
    const runEstimate = async () => {
      console.log('=== Starting Estimation Process ===');
      console.log('Current conditions:', {
        hasSecretJs: !!secretjs,
        payAmount: payDetails.amount,
        payTokenAddress: payToken?.address,
        receiveTokenAddress: receiveToken?.address,
      });

      // Set default "0" when conditions aren't met
      if (!secretjs) {
        console.log('❌ Estimation failed: secretjs not initialized');
        setEstimatedOutput('0');
        setPriceImpact('0');
        setPoolFee('0');
        setTxFee('0');
        setIsEstimating(false);
        return;
      }

      if (
        typeof payDetails.amount !== 'string' ||
        payDetails.amount === '' ||
        payDetails.amount === '0'
      ) {
        console.log('❌ Estimation failed: no pay amount or amount is zero');
        setEstimatedOutput('0');
        setPriceImpact('0');
        setPoolFee('0');
        setTxFee('0');
        setIsEstimating(false);
        return;
      }

      const amount = parseFloat(payDetails.amount);
      if (isNaN(amount) || amount <= 0) {
        console.log('❌ Estimation failed: pay amount is invalid or less than or equal to zero');
        setEstimatedOutput('0');
        setPriceImpact('0');
        setPoolFee('0');
        setTxFee('0');
        setIsEstimating(false);
        return;
      }

      if (!payToken || !receiveToken) {
        console.log('❌ Estimation failed: tokens not properly initialized');
        setEstimatedOutput('0');
        setPriceImpact('0');
        setPoolFee('0');
        setTxFee('0');
        setIsEstimating(false);
        return;
      }

      setIsEstimating(true);

      try {
        const poolAddress = 'secret1qyt4l47yq3x43ezle4nwlh5q0sn6f9sesat7ap';
        const estimation = await estimateSwapOutput(
          secretjs,
          poolAddress,
          payToken,
          receiveToken,
          payDetails.amount
        );

        setEstimatedOutput(estimation.outputAmount);
        setPriceImpact(estimation.priceImpact);
        setPoolFee(estimation.poolFee);
        setTxFee(estimation.txFee);

        // Calculate min receive based on output and slippage
        const minReceiveAmount = new Decimal(estimation.outputAmount)
          .mul(new Decimal(1).sub(slippage / 100))
          .toFixed(6);
        setMinReceive(minReceiveAmount);
      } catch (error) {
        console.error('❌ Error during estimation:', error);
        setEstimatedOutput('0');
        setPriceImpact('0');
        setPoolFee('0');
        setTxFee('0');
      } finally {
        setIsEstimating(false);
      }
    };

    void runEstimate();
  }, [payDetails.amount, payToken, receiveToken, secretjs, slippage]);

  // first, we estimate the full swap details

  const handleEstimate = async () => {
    if (
      secretjs &&
      payDetails.amount !== undefined &&
      payToken?.address !== undefined &&
      receiveToken?.address !== undefined
    ) {
      const amountInDecimal = new Decimal(payDetails.amount);
      const tokenPoolMap = buildTokenPoolMap(fullPoolsData);
      const paths = findPaths(tokenPoolMap, payToken.address, receiveToken.address);

      if (paths.length === 0) {
        console.log('No available paths found for the selected tokens.');
        return;
      }

      const bestPathEstimation = await estimateBestPath(secretjs, paths, amountInDecimal);

      if (bestPathEstimation) {
        console.log('--- Best Path Estimation in handleEstimate ---');
        console.log('Best Path Estimation:', bestPathEstimation);
        console.log('Final Output:', bestPathEstimation.finalOutput.toString());
        console.log('Ideal Output:', bestPathEstimation.idealOutput.toString());
        console.log('LP Fee:', bestPathEstimation.totalLpFee.toString());
        console.log('Total Price Impact:', bestPathEstimation.totalPriceImpact);
        console.log('Total Gas Cost:', bestPathEstimation.totalGasCost);
        console.log('--- End Best Path Estimation in handleEstimate ---');

        setBestPathEstimation(bestPathEstimation);
      } else {
        setEstimatedOutput('Error in estimating the best route');
      }
    }
  };

  // then, we allow the user to execute the swap

  const handleSwapClick = async () => {
    const keplr = (window as unknown as Window).keplr;
    if (!isNotNullish(keplr)) {
      alert('Keplr extension not detected.');
      return;
    }
    showDebugAlert();
    if (payToken === undefined || receiveToken === undefined) {
      toast.error('Pay or receive token is undefined');
      return;
    }
    if (!secretjs) {
      console.error('SecretNetworkClient is not initialized');
      return;
    }

    const path = bestPathEstimation?.path;
    if (!path) {
      console.error('No path found for swap execution');
      return;
    }

    if (!isNotNullish(keplr)) {
      alert('Keplr is not installed');
      return;
    }

    const inputViewingKey = await keplr.getSecret20ViewingKey(
      'secret-4',
      getApiTokenAddress(payToken)
    );
    const outputViewingKey = await keplr.getSecret20ViewingKey(
      'secret-4',
      getApiTokenAddress(receiveToken)
    );

    if (inputViewingKey === undefined || outputViewingKey === undefined) {
      alert('Viewing keys are missing. Please create them before swapping.');
      return;
    }

    try {
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
        gasPriceInFeeDenom: 0.25,
        feeDenom: 'uscrt',
        // Only include explicitSignerData if both sequence and accountNumber are available
        // TODO: explicitSignerData is probably not needed. I think secretjs handles this.
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

      const decimalsIn = getTokenDecimals(getApiTokenAddress(payToken));
      if (decimalsIn === undefined) {
        throw new Error(`Decimals for token ${payToken.address} could not be determined`);
      }
      const decimalsOut = getTokenDecimals(getApiTokenAddress(receiveToken));
      if (decimalsOut === undefined) {
        throw new Error(`Decimals for token ${receiveToken.address} could not be determined`);
      }

      const send_amount = new Decimal(payDetails.amount)
        .times(Decimal.pow(10, decimalsIn))
        .toFixed(0);

      let expected_return = bestPathEstimation.finalOutput
        .times(new Decimal(1).minus(slippage))
        .times(Decimal.pow(10, decimalsOut))
        .toFixed(0);

      // make sure even low value trade won't lose funds
      if (new Decimal(expected_return).lt(1)) {
        expected_return = '1';
      }
      console.log('Expected Return:', expected_return);

      let sendMsg: Snip20SendOptions;
      let result: TxResponse;
      const hops: Hop[] = [];

      if (path.pools.length >= 2) {
        console.log('Multiple hops. Using Router contract.');

        // Loop to construct the Hop array.
        for (let i = 0; i < path.pools.length; i++) {
          const poolAddress = path.pools[i];
          const inputTokenAddress = path.tokens[i];
          const outputTokenAddress = path.tokens[i + 1];

          // TODO: Get poolCodeHash dynamically here.
          const poolCodeHash = '0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490';
          const inputTokenCodeHash = getCodeHashByAddress(inputTokenAddress!);

          const hop: Hop = {
            from_token: {
              snip20: {
                address: inputTokenAddress!,
                code_hash: inputTokenCodeHash,
              },
            },
            pair_address: poolAddress!,
            pair_code_hash: poolCodeHash,
          };

          console.debug(`Hop ${i + 1}`, hop);

          hops.push(hop);

          console.log(`Hop ${i + 1} on pool ${poolAddress}`);
          console.log(`Swapping ${inputTokenAddress} for ${outputTokenAddress}`);
        }

        sendMsg = {
          send: {
            // NOTE: Router Contract
            recipient: 'secret1xy5r5j4zp0v5fzza5r9yhmv7nux06rfp2yfuuv',
            amount: send_amount,
            msg: btoa(
              JSON.stringify({
                to: walletAddress,
                hops,
                expected_return,
              })
            ),
          },
        };

        console.log('Swapping with message:', JSON.stringify(sendMsg, null, 2));

        result = await secretjs.tx.snip20.send(
          {
            sender: walletAddress!,
            contract_address: path.tokens[0]!,
            code_hash: getCodeHashByAddress(path.tokens[0]!),
            msg: sendMsg,
            sent_funds: [],
          },
          txOptions
        );
      } else {
        console.log('Single hop. Using Pair contract directly.');

        const poolAddress = path.pools[0];
        const inputTokenAddress = path.tokens[0];
        const outputTokenAddress = path.tokens[1];

        console.log(`Executing swap on pool ${poolAddress}`);
        console.log(`Swapping ${inputTokenAddress} for ${outputTokenAddress}`);

        const swapMsg = {
          swap: {
            expected_return: expected_return,
            to: walletAddress,
          },
        };

        sendMsg = {
          send: {
            recipient: poolAddress!,
            amount: send_amount,
            msg: btoa(JSON.stringify(swapMsg)),
          },
        };

        console.log('Swapping with message:', JSON.stringify(sendMsg, null, 2));
        console.log('Callback message:', JSON.stringify(swapMsg, null, 2));

        // gasLimit could be changed depending on single swap or multi hop
        txOptions.gasLimit = 500_000;

        result = await secretjs.tx.snip20.send(
          {
            sender: walletAddress!,
            contract_address: inputTokenAddress!,
            code_hash: getCodeHashByAddress(inputTokenAddress!),
            msg: sendMsg,
            sent_funds: [],
          },
          txOptions
        );
      }

      setPending(false);
      setResult(result);

      console.log('Transaction Result:', result);

      if (result.code !== TxResultCode.Success) {
        throw new Error(`Swap failed: ${result.rawLog}`);
      }

      console.log(`Swap executed successfully!`);
      // TODO: probably want to take out these alerts
      alert('Swap completed successfully!');
      // why is this updating the estimated output? probably a relic of the test page.
      // What (if anything) should be updated with this message instead?
      setEstimatedOutput('Swap completed successfully!');
    } catch (error) {
      console.error('Error during swap execution:', error);
      alert('Swap failed. Check the console for more details.');
      setEstimatedOutput('Error during swap execution. Please try again.');
    }
  };

  const showDebugAlert = () => {
    if (payToken === undefined || receiveToken === undefined) {
      toast.error('Pay or receive token is undefined');
      return;
    }
    const alertMessage = `Swapping Details:
    
Pay Token: ${getApiTokenSymbol(payToken)}
Pay Amount: ${payDetails.amount}

Receive Token: ${getApiTokenSymbol(receiveToken)}
Receive Amount: ${receiveDetails.amount}

Slippage: ${slippage}
Gas: ${gas}

Price Impact: ${priceImpact}% = ${(
      (parseFloat(priceImpact) / 100) *
      parseFloat(payDetails.amount)
    ).toFixed(4)} ${getApiTokenSymbol(payToken)}
TX Fee: ${txFee} ${getApiTokenSymbol(payToken)} = ${(
      (parseFloat(txFee) / parseFloat(payDetails.amount)) *
      100
    ).toFixed(2)}%
Min Receive: ${minReceive} ${getApiTokenSymbol(receiveToken)}

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

    alert(alertMessage);
  };

  return {
    swappableTokens,
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
    handleEstimate,
    handleSwapClick,
  };
};
