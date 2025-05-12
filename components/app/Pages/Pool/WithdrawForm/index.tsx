import FormButton from '@/components/app/Shared/Forms/FormButton';
import PoolTokenInput from '@/components/app/Shared/Forms/Input/PoolTokenInput';
import PoolSelectionModal from '@/components/app/Shared/Forms/Select/PoolSelectionModal';
import { usePoolForm } from '@/hooks/usePoolForm/usePoolForm';
import { usePoolStore } from '@/store/forms/poolStore';
import * as Dialog from '@radix-ui/react-dialog';
import React from 'react';

const WithdrawForm: React.FC = () => {
  const { selectedPool } = usePoolStore();
  const { handleClick, withdrawEstimate } = usePoolForm(selectedPool?.address);

  if (!selectedPool) {
    return (
      <div className="flex flex-col gap-6 py-2.5 px-2.5 flex-1 justify-center items-center">
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button className="bg-adamant-primary hover:bg-adamant-primary/90 text-white font-medium py-2 px-4 rounded-lg">
              Select a Pool
            </button>
          </Dialog.Trigger>
          <PoolSelectionModal />
        </Dialog.Root>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-2.5 px-2.5 flex-1 justify-between">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button className="w-full bg-adamant-box-dark hover:bg-adamant-box-light transition-all duration-200 rounded-xl p-4 border border-adamant-gradientBright/20 hover:border-adamant-gradientBright group">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-adamant-accentText text-sm">Selected Pool</span>
                    <span className="text-white font-medium flex items-center gap-2">
                      {selectedPool.token0?.symbol} / {selectedPool.token1?.symbol}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-adamant-gradientBright group-hover:translate-x-0.5 transition-transform"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>
                  <span className="text-adamant-gradientBright text-sm font-medium group-hover:text-adamant-gradientDark">
                    Change Pool
                  </span>
                </div>
              </button>
            </Dialog.Trigger>
            <PoolSelectionModal />
          </Dialog.Root>
        </div>
        <PoolTokenInput
          poolInputIdentifier="pool.withdraw.lpToken"
          token={{
            symbol: `${selectedPool.token0?.symbol} / ${selectedPool.token1?.symbol} LP`,
            address: selectedPool.pairInfo.liquidity_token,
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
      </div>
      <FormButton onClick={() => handleClick('withdraw')} text="Withdraw Liquidity" />
    </div>
  );
};

export default WithdrawForm;
