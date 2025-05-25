import FormButton from '@/components/app/Shared/Forms/FormButton';
import PoolTokenInput from '@/components/app/Shared/Forms/Input/PoolTokenInput';
import PoolFormBase from '@/components/app/Shared/Forms/PoolFormBase';
import PoolLiquidityDisplay from '@/components/app/Shared/PoolLiquidityDisplay';
import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { usePoolForm } from '@/hooks/usePoolForm/usePoolForm';
import { usePoolStore } from '@/store/forms/poolStore';
import { AlertTriangle } from 'lucide-react';
import React from 'react';

const WithdrawForm: React.FC = () => {
  const { selectedPool } = usePoolStore();
  const { handleClick, withdrawEstimate, validationWarning, pairPoolData, loadingState } =
    usePoolForm(selectedPool?.address);

  // Get the LP token address from LIQUIDITY_PAIRS config
  const pairInfo = selectedPool
    ? LIQUIDITY_PAIRS.find((pair) => pair.pairContract === selectedPool.address)
    : null;
  const lpTokenAddress = pairInfo?.lpToken;

  // Error message if LP token not found
  const errorMessage =
    selectedPool && !lpTokenAddress ? 'LP token not found for this pool' : undefined;

  const actionButton = (
    <FormButton onClick={() => handleClick('withdraw')} text="Withdraw Liquidity" />
  );

  // Calculate pool liquidity display values
  const poolLiquidity = React.useMemo(() => {
    if (!pairPoolData?.assets || !selectedPool?.token0 || !selectedPool?.token1) {
      return null;
    }

    const token0Asset = pairPoolData.assets.find(
      (asset) => asset.info.token.contract_addr === selectedPool.token0?.address
    );
    const token1Asset = pairPoolData.assets.find(
      (asset) => asset.info.token.contract_addr === selectedPool.token1?.address
    );

    if (!token0Asset || !token1Asset) return null;

    const token0Amount =
      parseFloat(token0Asset.amount) / Math.pow(10, selectedPool.token0.decimals);
    const token1Amount =
      parseFloat(token1Asset.amount) / Math.pow(10, selectedPool.token1.decimals);
    const totalLpSupply = pairPoolData.total_share
      ? parseFloat(pairPoolData.total_share) / Math.pow(10, 6)
      : 0;

    return {
      token0Amount: token0Amount.toFixed(6),
      token1Amount: token1Amount.toFixed(6),
      totalLpSupply: totalLpSupply.toFixed(6),
    };
  }, [pairPoolData, selectedPool]);

  return (
    <PoolFormBase actionButton={actionButton} errorMessage={errorMessage}>
      {selectedPool && lpTokenAddress && (
        <>
          <PoolLiquidityDisplay
            title="Pool Liquidity"
            isLoading={loadingState.status === 'loading'}
            hasLiquidity={!!poolLiquidity}
            token0={selectedPool?.token0}
            token1={selectedPool?.token1}
            token0Amount={poolLiquidity?.token0Amount}
            token1Amount={poolLiquidity?.token1Amount}
            totalLpSupply={poolLiquidity?.totalLpSupply}
            showLpSupply={true}
          />

          <PoolTokenInput
            poolInputIdentifier="pool.withdraw.lpToken"
            token={{
              symbol: `${selectedPool.token0?.symbol} / ${selectedPool.token1?.symbol} LP`,
              address: lpTokenAddress,
            }}
            label="Withdraw LP Tokens"
          />

          {/* Validation Warning */}
          {validationWarning && (
            <div className="bg-adamant-app-box/50 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-300 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-amber-300 text-sm font-medium">{validationWarning.message}</p>
                  <p className="text-amber-400/80 text-sm mt-1">
                    Maximum available: {validationWarning.maxAvailable}{' '}
                    {validationWarning.tokenSymbol}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Withdraw Estimate */}
          {withdrawEstimate && withdrawEstimate.isValid && (
            <PoolLiquidityDisplay
              title={`You will receive (${withdrawEstimate.proportion} of pool)`}
              isLoading={false}
              hasLiquidity={true}
              token0={selectedPool?.token0}
              token1={selectedPool?.token1}
              token0Amount={withdrawEstimate.token0Amount}
              token1Amount={withdrawEstimate.token1Amount}
              showLpSupply={false}
            />
          )}

          {/* Error Display - Only show for technical errors, not balance issues */}
          {withdrawEstimate &&
            !withdrawEstimate.isValid &&
            withdrawEstimate.error &&
            !validationWarning && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-red-400 text-sm">{withdrawEstimate.error}</p>
                  </div>
                </div>
              </div>
            )}
        </>
      )}
    </PoolFormBase>
  );
};

export default WithdrawForm;
