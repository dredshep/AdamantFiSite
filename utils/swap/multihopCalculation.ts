import { calculateSingleHopOutput } from '@/utils/estimation/calculateSingleHopOutput';
import { getPoolData } from '@/utils/estimation/getPoolData';
import Decimal from 'decimal.js';
import { SecretNetworkClient } from 'secretjs';
import { MultihopPath } from './routing';

/**
 * Calculate the output for a multihop swap route
 * For direct swaps (1 hop), uses existing single hop calculation
 * For multihop swaps (2+ hops), chains multiple single hop calculations
 */
export async function calculateMultihopOutput(
  secretjs: SecretNetworkClient,
  path: MultihopPath,
  inputAmount: Decimal
): Promise<{ output: Decimal; totalPriceImpact: string; totalFee: Decimal }> {
  console.log('🔄 Starting multihop calculation:', {
    isDirectPath: path.isDirectPath,
    totalHops: path.totalHops,
    inputAmount: inputAmount.toString(),
  });

  if (path.isDirectPath) {
    // Direct swap - single hop
    const hop = path.hops[0];
    if (!hop) {
      throw new Error('No hop found for direct swap');
    }

    console.log('🎯 Direct swap calculation for hop:', hop);

    try {
      const poolData = await getPoolData(
        secretjs,
        hop.pairContract,
        '0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490'
      );
      const result = calculateSingleHopOutput(inputAmount, poolData, hop.fromToken, hop.toToken);

      return {
        output: result.output,
        totalPriceImpact: result.priceImpact,
        totalFee: result.lpFee,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('no liquidity')) {
        console.log('💧 Direct swap pool has no liquidity, returning zero output');
        return {
          output: new Decimal(0),
          totalPriceImpact: 'N/A',
          totalFee: new Decimal(0),
        };
      }
      throw error; // Re-throw other errors
    }
  }

  // Multihop swap - chain multiple hops
  console.log('🔀 Multihop swap calculation with', path.hops.length, 'hops');

  let currentAmount = inputAmount;
  let totalFee = new Decimal(0);
  let totalPriceImpactDecimal = new Decimal(0);

  for (let i = 0; i < path.hops.length; i++) {
    const hop = path.hops[i];
    if (!hop) {
      throw new Error(`Hop ${i} is undefined`);
    }

    console.log(`🔗 Processing hop ${i + 1}/${path.hops.length}:`, {
      fromToken: hop.fromToken,
      toToken: hop.toToken,
      pairContract: hop.pairContract,
      inputAmount: currentAmount.toString(),
    });

    try {
      const poolData = await getPoolData(
        secretjs,
        hop.pairContract,
        '0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490'
      );
      const hopResult = calculateSingleHopOutput(
        currentAmount,
        poolData,
        hop.fromToken,
        hop.toToken
      );

      // Update for next hop
      currentAmount = hopResult.output;
      totalFee = totalFee.plus(hopResult.lpFee);

      // Accumulate price impact
      const hopPriceImpactDecimal = new Decimal(hopResult.priceImpact.replace('%', ''));
      totalPriceImpactDecimal = totalPriceImpactDecimal.plus(hopPriceImpactDecimal);

      console.log(`✅ Hop ${i + 1} completed:`, {
        output: hopResult.output.toString(),
        priceImpact: hopResult.priceImpact,
        lpFee: hopResult.lpFee.toString(),
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('no liquidity')) {
        console.log(`💧 Hop ${i + 1} pool has no liquidity, returning zero output`);
        return {
          output: new Decimal(0),
          totalPriceImpact: 'N/A',
          totalFee: new Decimal(0),
        };
      }
      throw error; // Re-throw other errors
    }
  }

  const finalOutput = currentAmount;
  const finalPriceImpact = totalPriceImpactDecimal.toFixed(2);

  console.log('🎯 Multihop calculation completed:', {
    finalOutput: finalOutput.toString(),
    totalPriceImpact: finalPriceImpact,
    totalFee: totalFee.toString(),
  });

  return {
    output: finalOutput,
    totalPriceImpact: finalPriceImpact,
    totalFee: totalFee,
  };
}
