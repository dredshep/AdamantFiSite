import { PoolData } from '@/types/estimation/PoolData';
import Decimal from 'decimal.js';
import { isValidReserve } from '.';

export const calculateSingleHopOutput = (
  amountIn: Decimal,
  poolData: PoolData,
  inputToken: string,
  outputToken: string
): {
  output: Decimal;
  idealOutput: Decimal;
  priceImpact: string;
  lpFee: Decimal;
} => {
  const rawInputReserve = poolData.reserves[inputToken];
  const rawOutputReserve = poolData.reserves[outputToken];

  if (!isValidReserve(rawInputReserve) || !isValidReserve(rawOutputReserve)) {
    throw new Error('Invalid token addresses or malformed reserve data');
  }

  console.log(`\n--- Calculation Start ---`);
  console.log(`Input Token: ${inputToken}`);
  console.log(`Output Token: ${outputToken}`);
  console.log(
    `Raw Input Reserve: ${rawInputReserve.amount.toString()} (Decimals: ${
      rawInputReserve.decimals
    })`
  );
  console.log(
    `Raw Output Reserve: ${rawOutputReserve.amount.toString()} (Decimals: ${
      rawOutputReserve.decimals
    })`
  );
  console.log(`Amount In: ${amountIn.toString()}`);

  const inputReserve = rawInputReserve.amount;
  const outputReserve = rawOutputReserve.amount;

  // Adjust input amount by input token decimals
  const amountInAdjusted = amountIn.mul(Decimal.pow(10, rawInputReserve.decimals));
  console.log(`Amount In Adjusted: ${amountInAdjusted.toString()}`);

  // Calculate fee and adjust input amount
  const feeMultiplier = new Decimal(1).sub(poolData.fee);
  const amountInWithFee = amountInAdjusted.mul(feeMultiplier);
  console.log(`Amount In With Fee: ${amountInWithFee.toString()}`);

  // Compute output using constant product formula
  const productOfReserves = inputReserve.mul(outputReserve);
  const newInputReserve = inputReserve.add(amountInWithFee);
  const newOutputReserve = productOfReserves.div(newInputReserve);
  let output = outputReserve.sub(newOutputReserve);
  console.log(`New Input Reserve: ${newInputReserve.toString()}`);
  console.log(`New Output Reserve: ${newOutputReserve.toString()}`);
  console.log(`Output Before Decimal Adjustment: ${output.toString()}`);

  // Adjust output by output token decimals
  output = output.div(Decimal.pow(10, rawOutputReserve.decimals));
  console.log(`Output After Decimal Adjustment: ${output.toString()}`);

  // Calculate ideal output assuming infinite liquidity (no price impact)
  const idealOutput = amountInAdjusted.mul(outputReserve).div(inputReserve);
  console.log(`Ideal Output Before Decimal Adjustment: ${idealOutput.toString()}`);

  // Adjust ideal output by output token decimals
  let idealOutputAdjusted = idealOutput.div(Decimal.pow(10, rawOutputReserve.decimals));
  console.log(`Ideal Output After Decimal Adjustment: ${idealOutputAdjusted.toString()}`);

  // Ensure ideal output isn't negative
  if (idealOutputAdjusted.isNegative()) {
    console.warn('Calculated ideal output is negative after decimal adjustment.');
    idealOutputAdjusted = new Decimal(0);
  }

  // Calculate price impact
  const priceImpact = idealOutputAdjusted.sub(output).div(idealOutputAdjusted).mul(100).toFixed(2);
  console.log(`Price Impact: ${priceImpact}%`);

  // Correct calculation of Liquidity Provider Fee
  const lpFee = amountIn.sub(amountInWithFee.div(Decimal.pow(10, rawInputReserve.decimals)));
  console.log(`Liquidity Provider Fee: ${lpFee.toString()}`);
  console.log(`--- Calculation End ---\n`);

  // Return the results
  return {
    output,
    idealOutput: idealOutputAdjusted,
    priceImpact, // Now priceImpact is properly initialized and returned
    lpFee,
  };
};
