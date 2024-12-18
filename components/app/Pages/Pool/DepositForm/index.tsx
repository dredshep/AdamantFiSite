import FormButton from '@/components/app/Shared/Forms/FormButton';
import TokenInput from '@/components/app/Shared/Forms/Input/TokenInput';
import PoolSelectionModal from '@/components/app/Shared/Forms/Select/PoolSelectionModal';
import { usePoolForm } from '@/hooks/usePoolForm';
import { usePoolStore } from '@/store/forms/poolStore';
import { getApiTokenSymbol } from '@/utils/apis/getSwappableTokens';
import * as Dialog from '@radix-ui/react-dialog';
import React from 'react';

const DepositForm: React.FC = () => {
  const { selectedPool } = usePoolStore();
  const { handleClick } = usePoolForm(selectedPool?.address);

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
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button className="w-full bg-adamant-box-dark hover:bg-adamant-box-light transition-all duration-200 rounded-xl p-4 border border-adamant-gradientBright/20 hover:border-adamant-gradientBright group">
              <div className="flex justify-between items-center">
                <div className="flex flex-col items-start gap-1">
                  <span className="text-adamant-accentText text-sm">Selected Pool</span>
                  <span className="text-white font-medium flex items-center gap-2">
                    {getApiTokenSymbol(selectedPool.token0!)} /{' '}
                    {getApiTokenSymbol(selectedPool.token1!)}
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

        <TokenInput
          inputIdentifier="pool.deposit.tokenA"
          formType="pool"
        />
        <TokenInput
          inputIdentifier="pool.deposit.tokenB"
          formType="pool"
        />
        {/* <div className="flex flex-col gap-2 px-2.5 text-gray-400 text-sm">
          <div className="flex justify-between">
            <span>APR:</span>
            <span>{apr}%</span>
          </div>
          <div className="flex justify-between">
            <span>Estimated LP Tokens:</span>
            <span>{estimatedLPTokens}</span>
          </div>
        </div> */}
      </div>
      <FormButton onClick={() => handleClick('deposit')} text="Provide Liquidity" />
    </div>
  );
};

export default DepositForm;
