import FormButton from '@/components/app/Shared/Forms/FormButton';
import TokenInput from '@/components/app/Shared/Forms/Input/TokenInput';
import PoolFormBase from '@/components/app/Shared/Forms/PoolFormBase';
import PoolLiquidityDisplay from '@/components/app/Shared/PoolLiquidityDisplay';
import { TOKENS } from '@/config/tokens';
import { usePoolForm } from '@/hooks/usePoolForm/usePoolForm';
import { usePoolStore } from '@/store/forms/poolStore';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import React from 'react';
import AutoStakeOption from './AutoStakeOption';

const DepositForm: React.FC = () => {
  const { selectedPool } = usePoolStore();
  const { handleClick, hasStakingRewards, pairPoolData, validationWarning } = usePoolForm(
    selectedPool?.pairContract
  );

  const token0 = selectedPool ? TOKENS.find((t) => t.symbol === selectedPool.token0) : undefined;
  const token1 = selectedPool ? TOKENS.find((t) => t.symbol === selectedPool.token1) : undefined;

  const actionButton = (
    <FormButton
      onClick={() => handleClick('deposit')}
      text="Provide Liquidity"
      className="bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark hover:from-adamant-gradientDark hover:to-adamant-gradientBright"
    />
  );

  // Calculate liquidity display values
  const getLiquidityInfo = () => {
    if (!pairPoolData?.assets || !token0 || !token1) {
      return { hasLiquidity: false, token0Amount: '0', token1Amount: '0', isLoading: true };
    }

    const token0Asset = pairPoolData.assets.find(
      (asset) => asset.info.token.contract_addr === token0.address
    );
    const token1Asset = pairPoolData.assets.find(
      (asset) => asset.info.token.contract_addr === token1.address
    );

    if (!token0Asset || !token1Asset) {
      return { hasLiquidity: false, token0Amount: '0', token1Amount: '0', isLoading: false };
    }

    // Use token decimals for proper conversion
    const token0Decimals = token0.decimals || 6;
    const token1Decimals = token1.decimals || 6;

    const token0Amount = (parseFloat(token0Asset.amount) / Math.pow(10, token0Decimals)).toFixed(6);
    const token1Amount = (parseFloat(token1Asset.amount) / Math.pow(10, token1Decimals)).toFixed(6);
    const hasLiquidity = parseFloat(token0Amount) > 0 && parseFloat(token1Amount) > 0;

    return { hasLiquidity, token0Amount, token1Amount, isLoading: false };
  };

  const liquidityInfo = getLiquidityInfo();

  return (
    <PoolFormBase actionButton={actionButton}>
      <PoolLiquidityDisplay
        title="Pool Liquidity"
        isLoading={liquidityInfo.isLoading}
        hasLiquidity={liquidityInfo.hasLiquidity}
        token0={token0}
        token1={token1}
        token0Amount={liquidityInfo.token0Amount}
        token1Amount={liquidityInfo.token1Amount}
        showLpSupply={false}
        emptyStateMessage={{
          title: 'No liquidity available',
          description: "You'll be the first liquidity provider. You can set any ratio.",
        }}
      />

      <TokenInput inputIdentifier="pool.deposit.tokenA" formType="pool" />
      <TokenInput inputIdentifier="pool.deposit.tokenB" formType="pool" />

      {/* Validation Warning */}
      {validationWarning && (
        <div className="p-4 bg-adamant-app-box/50 rounded-xl border border-amber-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-amber-300">{validationWarning.message}</div>
              <div className="text-xs text-amber-400/80 mt-1">
                Maximum available: {validationWarning.maxAvailable} {validationWarning.tokenSymbol}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Display auto-stake option if staking is available */}
      {hasStakingRewards && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AutoStakeOption />
        </motion.div>
      )}
    </PoolFormBase>
  );
};

export default DepositForm;
