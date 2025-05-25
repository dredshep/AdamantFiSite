import FormButton from '@/components/app/Shared/Forms/FormButton';
import PoolTokenInput from '@/components/app/Shared/Forms/Input/PoolTokenInput';
import PoolFormBase from '@/components/app/Shared/Forms/PoolFormBase';
import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { usePoolForm } from '@/hooks/usePoolForm/usePoolForm';
import { usePoolStore } from '@/store/forms/poolStore';
import React from 'react';

const WithdrawForm: React.FC = () => {
  const { selectedPool } = usePoolStore();
  const { handleClick, withdrawEstimate } = usePoolForm(selectedPool?.address);

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

  return (
    <PoolFormBase actionButton={actionButton} errorMessage={errorMessage}>
      {selectedPool && lpTokenAddress && (
        <>
          <PoolTokenInput
            poolInputIdentifier="pool.withdraw.lpToken"
            token={{
              symbol: `${selectedPool.token0?.symbol} / ${selectedPool.token1?.symbol} LP`,
              address: lpTokenAddress,
            }}
            label="Withdraw LP Tokens"
          />
          {withdrawEstimate && (
            <div className="flex flex-col gap-2 bg-adamant-box-dark/50 p-4 rounded-xl">
              <span className="text-adamant-accentText text-sm">You will receive:</span>
              <div className="flex flex-col gap-1">
                <span className="text-white">
                  {withdrawEstimate.token0Amount} {selectedPool.token0?.symbol}
                </span>
                <span className="text-white">
                  {withdrawEstimate.token1Amount} {selectedPool.token1?.symbol}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </PoolFormBase>
  );
};

export default WithdrawForm;
