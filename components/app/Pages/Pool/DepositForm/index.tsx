import FormButton from '@/components/app/Shared/Forms/FormButton';
import TokenInput from '@/components/app/Shared/Forms/Input/TokenInput';
import PoolSelectionModal from '@/components/app/Shared/Forms/Select/PoolSelectionModal';

import { usePoolForm } from '@/hooks/usePoolForm/usePoolForm';
import { usePoolStaking } from '@/hooks/usePoolStaking';
import { usePoolStore } from '@/store/forms/poolStore';
import { getApiTokenSymbol } from '@/utils/apis/getSwappableTokens';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import React from 'react';
import AutoStakeOption from './AutoStakeOption';

const DepositForm: React.FC = () => {
  const { selectedPool } = usePoolStore();
  const { handleClick } = usePoolForm(selectedPool?.address);
  const { hasStakingRewards } = usePoolStaking(selectedPool?.address ?? null);

  if (!selectedPool) {
    return (
      <div className="flex flex-col gap-6 py-2.5 px-2.5 flex-1 justify-center items-center">
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button className="bg-adamant-gradientBright hover:bg-adamant-gradientDark text-white font-medium py-2 px-4 rounded-lg transition-colors">
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
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-adamant-box-dark hover:bg-adamant-box-light transition-all duration-200 rounded-xl p-4 border border-adamant-gradientBright/20 hover:border-adamant-gradientBright group backdrop-blur-sm"
            >
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
            </motion.button>
          </Dialog.Trigger>
          <PoolSelectionModal />
        </Dialog.Root>

        <TokenInput inputIdentifier="pool.deposit.tokenA" formType="pool" />
        <TokenInput inputIdentifier="pool.deposit.tokenB" formType="pool" />

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
      </div>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <FormButton
          onClick={() => handleClick('deposit')}
          text="Provide Liquidity"
          className="bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark hover:from-adamant-gradientDark hover:to-adamant-gradientBright"
        />
      </motion.div>
    </div>
  );
};

export default DepositForm;
