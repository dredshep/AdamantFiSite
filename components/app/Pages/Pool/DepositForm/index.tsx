import FormButton from '@/components/app/Shared/Forms/FormButton';
import TokenInput from '@/components/app/Shared/Forms/Input/TokenInput';
import PoolFormBase from '@/components/app/Shared/Forms/PoolFormBase';
import { usePoolForm } from '@/hooks/usePoolForm/usePoolForm';
import { usePoolStore } from '@/store/forms/poolStore';
import { motion } from 'framer-motion';
import React from 'react';
import AutoStakeOption from './AutoStakeOption';

const DepositForm: React.FC = () => {
  const { selectedPool } = usePoolStore();
  const { handleClick, hasStakingRewards } = usePoolForm(selectedPool?.address);

  const actionButton = (
    <FormButton
      onClick={() => handleClick('deposit')}
      text="Provide Liquidity"
      className="bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark hover:from-adamant-gradientDark hover:to-adamant-gradientBright"
    />
  );

  return (
    <PoolFormBase actionButton={actionButton}>
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
    </PoolFormBase>
  );
};

export default DepositForm;
