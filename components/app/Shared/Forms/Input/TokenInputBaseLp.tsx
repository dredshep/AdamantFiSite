import { useLpTokenBalance } from '@/hooks/useLpTokenBalance';
import { useSecretNetwork } from '@/hooks/useSecretNetwork';
import { usePoolStore } from '@/store/forms/poolStore';
import { SecretString } from '@/types';
import React, { useEffect } from 'react';
import TokenImageWithFallback from '../../TokenImageWithFallback';
import TopRightBalanceLp from '../../TopRightBalanceLp';
import InputLabel from './InputLabel';
import { PoolInputIdentifier } from './TokenInputBase';
import { INPUT_STYLES } from './inputStyles';

interface TokenInputBaseLpProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  tokenSymbol: string;
  tokenAddress: SecretString;
  inputIdentifier: PoolInputIdentifier;
  label: string;
  hasMax: boolean;
  isLoading: boolean;
}

const TokenInputBaseLp: React.FC<TokenInputBaseLpProps> = ({
  inputValue,
  onInputChange,
  tokenSymbol,
  tokenAddress,
  inputIdentifier,
  label = 'Amount',
  hasMax = false,
  isLoading = false,
}) => {
  const { secretjs, connect } = useSecretNetwork();
  const lpTokenData = useLpTokenBalance(tokenAddress);
  const { setTokenInputBalance } = usePoolStore();

  // Attempt to connect if not connected
  useEffect(() => {
    if (secretjs === null) {
      void connect();
    }
  }, [secretjs, connect]);

  // Sync LP token balance with pool store
  useEffect(() => {
    if (lpTokenData.amount !== null) {
      setTokenInputBalance(inputIdentifier, lpTokenData.amount);
    }
  }, [lpTokenData.amount, inputIdentifier, setTokenInputBalance]);

  return (
    <div className={INPUT_STYLES.container}>
      <div className={INPUT_STYLES.header}>
        <InputLabel label={label} caseType="normal-case" />
        <TopRightBalanceLp
          balance={lpTokenData.amount}
          tokenSymbol={tokenSymbol}
          hasMax={hasMax}
          inputIdentifier={inputIdentifier}
          loading={lpTokenData.loading}
          error={lpTokenData.error}
          onFetchBalance={() => void lpTokenData.refetch()}
          onSuggestToken={() => void lpTokenData.suggestToken()}
        />
      </div>
      <div className={INPUT_STYLES.inputRow}>
        <div className="relative flex-1">
          <input
            type="text"
            className={INPUT_STYLES.inputField}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="0.0"
            disabled={isLoading}
            data-input-id={inputIdentifier}
          />
          {isLoading && (
            <div className={INPUT_STYLES.loadingOverlay}>
              <div className={INPUT_STYLES.loadingPlaceholder} />
            </div>
          )}
        </div>
        <div className={INPUT_STYLES.tokenSelectorStatic}>
          <TokenImageWithFallback tokenAddress={tokenAddress} size={24} />
          {tokenSymbol}
        </div>
      </div>
    </div>
  );
};

export default TokenInputBaseLp;
