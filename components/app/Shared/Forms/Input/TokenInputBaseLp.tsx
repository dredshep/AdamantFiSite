import { LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import { useLpTokenBalance } from '@/hooks/useLpTokenBalance';
import { useSecretNetwork } from '@/hooks/useSecretNetwork';
import { usePoolStore } from '@/store/forms/poolStore';
import { SecretString } from '@/types';
import React, { useEffect } from 'react';
import DualTokenIcon from '../../DualTokenIcon';
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

  // Get LP token information for proper dual icon display
  const lpTokenInfo = LIQUIDITY_PAIRS.find((pair) => pair.lpToken === tokenAddress);

  // Get token information for dual icons
  const token0 = lpTokenInfo ? TOKENS.find((t) => t.symbol === lpTokenInfo.token0) : undefined;
  const token1 = lpTokenInfo ? TOKENS.find((t) => t.symbol === lpTokenInfo.token1) : undefined;

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
          {token0 && token1 ? (
            <DualTokenIcon
              token0Address={token0.address}
              token1Address={token1.address}
              token0Symbol={token0.symbol}
              token1Symbol={token1.symbol}
              size={24}
            />
          ) : (
            <TokenImageWithFallback tokenAddress={tokenAddress} size={24} />
          )}
          {tokenSymbol}
        </div>
      </div>
    </div>
  );
};

export default TokenInputBaseLp;
