import DualTokenIcon from '@/components/app/Shared/DualTokenIcon';
import { LoadingPlaceholder } from '@/components/app/Shared/LoadingPlaceholder';
import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import { useRewardEstimates } from '@/hooks/staking/useRewardEstimates';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { SecretString } from '@/types';
import { getStakingContractInfo } from '@/utils/staking/stakingRegistry';
import { removeToast, showToastOnce, toastManager } from '@/utils/toast/toastManager';
import { Key, RefreshCw, Settings, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { TxResultCode } from 'secretjs';

interface StakingOverviewProps {
  stakedBalance: string | null;
  pendingRewards: string | null;
  rewardSymbol: string;
  isLoading: boolean;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  stakingContractAddress?: string;
  pairSymbol?: string;
  lpTokenAddress?: string;
}

const StakingOverview: React.FC<StakingOverviewProps> = ({
  stakedBalance,
  pendingRewards,
  rewardSymbol,
  isLoading,
  showRefreshButton = false,
  onRefresh,
  isRefreshing,
  stakingContractAddress = 'secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev',
  pairSymbol = 'LP',
  lpTokenAddress,
}) => {
  const [isUpdatingAllocation, setIsUpdatingAllocation] = useState(false);
  const [isSyncingKey, setIsSyncingKey] = useState(false);
  const [lpKeyValid, setLpKeyValid] = useState(false);
  const [stakingKeyValid, setStakingKeyValid] = useState(false);
  const { secretjs } = useKeplrConnection();

  // Get LP token address from staking contract if not provided
  const stakingInfo = stakingContractAddress
    ? getStakingContractInfo(stakingContractAddress)
    : null;
  const resolvedLpTokenAddress = lpTokenAddress || stakingInfo?.lpTokenAddress;

  // Use reward estimates hook if we have LP token address
  const rewardEstimates = useRewardEstimates(resolvedLpTokenAddress || '');

  // Check viewing key validity for LP token and staking contract
  useEffect(() => {
    const checkViewingKeys = async () => {
      if (!window.keplr || !resolvedLpTokenAddress || !stakingContractAddress || !secretjs) {
        console.log('🔑 ViewingKey check skipped:', {
          hasKeplr: !!window.keplr,
          hasLpAddress: !!resolvedLpTokenAddress,
          hasStakingAddress: !!stakingContractAddress,
          hasSecretjs: !!secretjs,
        });
        return;
      }

      try {
        console.log('🔑 Checking viewing keys for:', {
          lpToken: resolvedLpTokenAddress,
          stakingContract: stakingContractAddress,
        });

        // Check LP token viewing key - test if it actually works
        let lpValid = false;
        try {
          const lpKey = await window.keplr.getSecret20ViewingKey(
            'secret-4',
            resolvedLpTokenAddress
          );
          if (lpKey && lpKey.length > 0) {
            // Test if the LP key actually works by trying to query balance
            const lpStakingInfo = getStakingContractInfo(stakingContractAddress);
            if (lpStakingInfo) {
              await secretjs.query.compute.queryContract({
                contract_address: resolvedLpTokenAddress,
                code_hash: lpStakingInfo.lpTokenCodeHash,
                query: { balance: { address: secretjs.address, key: lpKey } },
              });
              lpValid = true;
              console.log('🔑 LP token viewing key is valid and works');
            }
          }
        } catch (err) {
          console.log('🔑 LP key test failed:', err);
          lpValid = false;
        }
        setLpKeyValid(lpValid);

        // Check staking contract viewing key - test if it actually works
        let stakingValid = false;
        try {
          const stakingKey = await window.keplr.getSecret20ViewingKey(
            'secret-4',
            stakingContractAddress
          );
          if (stakingKey && stakingKey.length > 0) {
            // Test if the staking key actually works by trying to query balance
            const stakingInfo = getStakingContractInfo(stakingContractAddress);
            if (stakingInfo) {
              await secretjs.query.compute.queryContract({
                contract_address: stakingContractAddress,
                code_hash: stakingInfo.stakingCodeHash,
                query: { balance: { address: secretjs.address, key: stakingKey } },
              });
              stakingValid = true;
              console.log('🔑 Staking contract viewing key is valid and works');
            }
          }
        } catch (err) {
          console.log('🔑 Staking key test failed:', err);
          stakingValid = false;
        }
        setStakingKeyValid(stakingValid);

        console.log('🔑 Viewing key status:', {
          lpKeyValid: lpValid,
          stakingKeyValid: stakingValid,
          showSyncButton: lpValid && !stakingValid,
        });
      } catch (error) {
        console.error('Error checking viewing keys:', error);
      }
    };

    void checkViewingKeys();
  }, [resolvedLpTokenAddress, stakingContractAddress, secretjs]);

  // Helper to format numbers cleanly - NEVER show '0' for null/unknown values
  const formatBalance = (value: string | null): string => {
    // If value is null/undefined, we don't know the balance - don't show anything
    if (value === null || value === undefined) return '';

    // If value is '0', that's actually zero - show it
    if (value === '0') return '0';

    const num = parseFloat(value);
    if (isNaN(num)) return '';

    // For very small numbers, show more decimals
    if (num < 0.001) return num.toFixed(8);
    // For normal numbers, show up to 6 decimals but remove trailing zeros
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 6,
      minimumFractionDigits: 0,
    });
  };

  // Helper to format USD values
  const formatUsd = (value: number | undefined): string => {
    if (!value || isNaN(value)) return '$0.00';
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Helper to format percentage
  const formatPercentage = (value: number): string => {
    if (isNaN(value)) return '0%';
    return `${value.toFixed(2)}%`;
  };

  // Properly distinguish between null (unknown) and '0' (actually zero)
  const hasStakedTokens = stakedBalance !== null && stakedBalance !== '0';
  const hasPendingRewards =
    pendingRewards !== null && pendingRewards !== '0' && parseFloat(pendingRewards) > 0;
  const isStakedBalanceKnown = stakedBalance !== null;
  const isPendingRewardsKnown = pendingRewards !== null;

  // Calculate current stake rewards if user has staked tokens
  const currentStakeRewards =
    hasStakedTokens && stakedBalance ? rewardEstimates.getCurrentStakeRewards(stakedBalance) : null;

  // Calculate user's share percentage
  const userSharePercentage =
    hasStakedTokens && stakedBalance ? rewardEstimates.getUserSharePercentage(stakedBalance) : 0;

  // Calculate staked value in USD - only if we have actual staked balance
  const stakedValueUsd =
    hasStakedTokens && stakedBalance && rewardEstimates.poolData.lpTokenPrice
      ? (parseFloat(stakedBalance) / 1_000_000) * rewardEstimates.poolData.lpTokenPrice
      : undefined;

  // Get LP token information for proper dual icon display
  const lpTokenInfo = resolvedLpTokenAddress
    ? LIQUIDITY_PAIRS.find((pair) => pair.lpToken === resolvedLpTokenAddress)
    : null;

  // Get token information for dual icons
  const token0 = lpTokenInfo ? TOKENS.find((t) => t.symbol === lpTokenInfo.token0) : undefined;
  const token1 = lpTokenInfo ? TOKENS.find((t) => t.symbol === lpTokenInfo.token1) : undefined;

  // Get bADMT token for reward display
  const rewardToken = TOKENS.find((t) => t.symbol === 'bADMT');

  // Sync LP viewing key to staking contract
  const handleSyncViewingKey = async () => {
    if (!window.keplr || !secretjs || !resolvedLpTokenAddress || !stakingContractAddress) {
      toastManager.keplrNotInstalled();
      return;
    }

    try {
      setIsSyncingKey(true);

      // Get the LP token viewing key
      const lpKey = await window.keplr.getSecret20ViewingKey('secret-4', resolvedLpTokenAddress);

      if (!lpKey || lpKey.length === 0) {
        showToastOnce('sync-key-error', 'LP token viewing key not found', 'error', {
          message: 'Please create a viewing key for the LP token first.',
          autoClose: 5000,
        });
        return;
      }

      // Get staking contract info for code hash
      const stakingInfo = getStakingContractInfo(stakingContractAddress);
      if (!stakingInfo) {
        showToastOnce('sync-key-error', 'Staking contract info not found', 'error', {
          autoClose: 5000,
        });
        return;
      }

      // Set the same viewing key on the staking contract
      const setViewingKeyMsg = {
        set_viewing_key: {
          key: lpKey,
        },
      };

      showToastOnce('sync-key-progress', 'Syncing viewing key...', 'info', {
        message: 'Please approve the transaction in Keplr to sync your viewing key.',
        autoClose: false,
      });

      const result = await secretjs.tx.compute.executeContract(
        {
          sender: secretjs.address,
          contract_address: stakingContractAddress,
          code_hash: stakingInfo.stakingCodeHash,
          msg: setViewingKeyMsg,
          sent_funds: [],
        },
        {
          gasLimit: 150_000,
        }
      );

      if (result.code === TxResultCode.Success) {
        showToastOnce('sync-key-success', 'Viewing key synced!', 'success', {
          message:
            'Your LP token viewing key has been successfully synced to the staking contract.',
          autoClose: 5000,
        });

        // Update the key validity state
        setStakingKeyValid(true);

        // Refresh balances if callback provided
        if (onRefresh) {
          setTimeout(() => {
            onRefresh();
          }, 1000);
        }
      } else {
        throw new Error(`Transaction failed: ${result.rawLog}`);
      }
    } catch (error) {
      console.error('Error syncing viewing key:', error);

      let errorMessage = 'Failed to sync viewing key';
      if (error instanceof Error) {
        if (error.message.includes('rejected') || error.message.includes('denied')) {
          errorMessage = 'Transaction was rejected by user';
        } else {
          errorMessage = error.message;
        }
      }

      showToastOnce('sync-key-error', 'Sync failed', 'error', {
        message: errorMessage,
        autoClose: 8000,
      });
    } finally {
      setIsSyncingKey(false);
      // Clear progress toast
      setTimeout(() => {
        removeToast('sync-key-progress');
      }, 500);
    }
  };

  // Update allocation function to trigger reward initialization
  const handleUpdateAllocation = async () => {
    if (!secretjs) {
      toastManager.keplrNotInstalled();
      return;
    }

    try {
      setIsUpdatingAllocation(true);

      // Bulk distributor contract details
      const bulkDistributorAddress = 'secret1s563hkkrzjzx9q8qcx3r47h7s0hn5kfgy9t62r';
      const bulkDistributorCodeHash =
        '89083455710f42520356d0fbaa2d3a6f8e1362e1b67040cd59d365d02378fad5'; // From docs

      // Execute update_allocation message
      const executeMsg = {
        update_allocation: {
          spy_addr: stakingContractAddress, // LP staking contract address
          spy_hash: 'c644edd309de7fd865b4fbe22054bcbe85a6c0b8abf5f110053fe1b2d0e8a72a', // LP staking contract code hash
          hook: null, // Optional hook, using null as per docs
        },
      };

      console.log('🚀 Triggering update_allocation on bulk distributor:', {
        bulkDistributorAddress,
        executeMsg,
      });

      const tx = await secretjs.tx.compute.executeContract(
        {
          sender: secretjs.address,
          contract_address: bulkDistributorAddress,
          code_hash: bulkDistributorCodeHash,
          msg: executeMsg,
          sent_funds: [],
        },
        {
          gasLimit: 200000,
          gasPriceInFeeDenom: 0.1,
        }
      );

      console.log('✅ Update allocation transaction successful:', tx);

      // Show success toast
      showToastOnce('update-allocation-success', 'Update allocation triggered', 'success', {
        message:
          'Successfully triggered reward allocation update. Balances are automatically refreshed every 10 seconds.',
        autoClose: 8000,
      });

      // Refresh data after successful update
      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Failed to update allocation:', error);

      let errorMessage = 'Failed to trigger update allocation';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      showToastOnce('update-allocation-error', 'Update allocation failed', 'error', {
        message: errorMessage,
        autoClose: 8000,
      });
    } finally {
      setIsUpdatingAllocation(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Pool Statistics - New section */}
      <div className="bg-adamant-box-dark/30 backdrop-blur-sm rounded-xl p-4 border border-adamant-box-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-adamant-text-box-main">Pool Statistics</h3>
          {showRefreshButton && onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1 text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-adamant-text-box-secondary">Total Staked</p>
            <div className="font-medium text-adamant-text-box-main">
              {rewardEstimates.poolData.isLoading ? (
                <LoadingPlaceholder size="small" />
              ) : (
                `${formatBalance(
                  rewardEstimates.poolData.totalLockedFormatted.toString()
                )} ${pairSymbol}`
              )}
            </div>
          </div>
          <div>
            <p className="text-adamant-text-box-secondary">TVL</p>
            <div className="font-medium text-adamant-text-box-main">
              {rewardEstimates.poolData.isLoading ? (
                <LoadingPlaceholder size="small" />
              ) : (
                formatUsd(rewardEstimates.poolData.tvlUsd)
              )}
            </div>
          </div>
          <div>
            <p className="text-adamant-text-box-secondary">Daily Rewards</p>
            <p className="font-medium text-adamant-accentText">
              {`${formatBalance(
                rewardEstimates.poolData.dailyPoolRewards.toString()
              )} ${rewardSymbol}`}
            </p>
          </div>
          <div>
            <p className="text-adamant-text-box-secondary">Your Share</p>
            <p className="font-medium text-adamant-text-box-main">
              {isLoading ? (
                <LoadingPlaceholder size="small" />
              ) : isStakedBalanceKnown ? (
                hasStakedTokens ? (
                  formatPercentage(userSharePercentage)
                ) : (
                  '0%'
                )
              ) : (
                <LoadingPlaceholder size="small" />
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Debug: Show viewing key states */}
      <div className="bg-adamant-box-dark/10 backdrop-blur-sm rounded-xl p-2 border border-gray-500/10 text-xs">
        <div className="text-gray-400">Debug: VK Status</div>
        <div className="flex gap-4 mt-1">
          <span className={`${lpKeyValid ? 'text-green-400' : 'text-red-400'}`}>
            LP: {lpKeyValid ? '✓' : '✗'}
          </span>
          <span className={`${stakingKeyValid ? 'text-green-400' : 'text-red-400'}`}>
            Staking: {stakingKeyValid ? '✓' : '✗'}
          </span>
          <span className={`${lpKeyValid && !stakingKeyValid ? 'text-blue-400' : 'text-gray-500'}`}>
            Sync: {lpKeyValid && !stakingKeyValid ? 'Available' : 'N/A'}
          </span>
        </div>
      </div>

      {/* Sync Key Button - Only show when LP key exists but staking key doesn't */}
      {lpKeyValid && !stakingKeyValid && (
        <div className="bg-adamant-box-dark/20 backdrop-blur-sm rounded-xl p-3 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-xs font-medium text-blue-400">Viewing Key Sync</p>
                <p className="text-xs text-adamant-text-box-secondary">
                  LP key found, sync to staking contract
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                void handleSyncViewingKey();
              }}
              disabled={isSyncingKey || !secretjs}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg
                       bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30
                       text-blue-400 transition-all duration-200 disabled:opacity-50
                       hover:scale-105 active:scale-95 disabled:hover:scale-100"
            >
              {isSyncingKey ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Key className="h-3 w-3" />
                  Sync Key
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Debug Section - Update Allocation Button */}
      <div className="bg-adamant-box-dark/20 backdrop-blur-sm rounded-xl p-3 border border-yellow-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-yellow-400" />
            <div>
              <p className="text-xs font-medium text-yellow-400">Debug Tools</p>
              <p className="text-xs text-adamant-text-box-secondary">
                Initialize reward allocation
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              void handleUpdateAllocation();
            }}
            disabled={isUpdatingAllocation || !secretjs}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg
                     bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30
                     text-yellow-400 transition-all duration-200 disabled:opacity-50
                     hover:scale-105 active:scale-95 disabled:hover:scale-100"
          >
            {isUpdatingAllocation ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Zap className="h-3 w-3" />
                Update Allocation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Staked Balance - Enhanced with USD value */}
      <div className="bg-adamant-box-dark/50 backdrop-blur-sm rounded-xl p-4 border border-adamant-box-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {token0 && token1 ? (
              <DualTokenIcon
                token0Address={token0.address}
                token1Address={token1.address}
                token0Symbol={token0.symbol}
                token1Symbol={token1.symbol}
                size={32}
                className="rounded-lg"
              />
            ) : (
              <TokenImageWithFallback
                tokenAddress={stakingContractAddress as SecretString}
                size={32}
                alt={`${pairSymbol} staking`}
                className="rounded-lg"
              />
            )}
            <div>
              <p className="text-sm font-medium text-adamant-text-box-main">Staked</p>
              <p className="text-xs text-adamant-text-box-secondary">{pairSymbol} LP</p>
              {stakedValueUsd && (
                <p className="text-xs text-adamant-text-box-secondary">
                  {formatUsd(stakedValueUsd)}
                </p>
              )}
            </div>
          </div>

          <div className="text-right">
            {isLoading ? (
              <LoadingPlaceholder size="medium" />
            ) : isStakedBalanceKnown ? (
              <div className="text-xl font-semibold text-adamant-text-box-main">
                {formatBalance(stakedBalance)}
              </div>
            ) : (
              <LoadingPlaceholder size="medium" />
            )}
          </div>
        </div>
      </div>

      {/* Pending Rewards - Enhanced with current earning rate */}
      {(hasPendingRewards || hasStakedTokens || !isPendingRewardsKnown) && (
        <div className="bg-adamant-box-dark/30 backdrop-blur-sm rounded-xl p-4 border border-adamant-accentText/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TokenImageWithFallback
                tokenAddress={rewardToken?.address || (stakingContractAddress as SecretString)}
                size={32}
                alt={`${rewardSymbol} rewards`}
                className="rounded-lg opacity-80"
              />
              <div>
                <p className="text-sm font-medium text-adamant-text-box-main">Rewards</p>
                <p className="text-xs text-adamant-text-box-secondary">{rewardSymbol}</p>
                {currentStakeRewards && currentStakeRewards.dailyRewards > 0 && (
                  <p className="text-xs text-adamant-accentText">
                    +{formatBalance(currentStakeRewards.dailyRewards.toString())}/day
                  </p>
                )}
              </div>
            </div>

            <div className="text-right flex items-center gap-2">
              {isLoading ? (
                <LoadingPlaceholder size="small" />
              ) : isPendingRewardsKnown ? (
                <>
                  <div className="text-xl font-semibold text-adamant-accentText">
                    {formatBalance(pendingRewards)}
                  </div>
                  {hasPendingRewards && (
                    <div className="w-2 h-2 bg-adamant-accentText rounded-full animate-pulse"></div>
                  )}
                </>
              ) : (
                <LoadingPlaceholder size="small" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StakingOverview;
