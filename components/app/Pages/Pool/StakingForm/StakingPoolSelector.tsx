import { getAllStakingPools } from '@/utils/staking/stakingRegistry';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { ExternalLink, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

const StakingPoolSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const stakingPools = getAllStakingPools();

  return (
    <div className="flex flex-col gap-8 py-6 px-6 flex-1 max-w-md mx-auto">
      <div className="text-center space-y-6">
        {/* Icon and Header */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-yellow-400/20 to-amber-500/20 p-6 rounded-2xl">
              <Sparkles className="w-12 h-12 text-yellow-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">Staking Not Available</h3>
            <p className="text-gray-400 text-base leading-relaxed max-w-sm mx-auto">
              This pool doesn't currently offer staking rewards, but we have other incentivized
              pools available!
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-adamant-app-box-darker p-6 rounded-xl space-y-4 text-left">
          <h4 className="text-lg font-semibold text-white text-center">
            About Our Staking Program
          </h4>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              Stake your LP tokens in our incentivized pools to earn{' '}
              <span className="text-yellow-400 font-semibold">bADMT</span> rewards.
            </p>
            <p>
              bADMT is AdamantFi's native token, giving you governance rights and a share of
              protocol revenue.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
          <Dialog.Trigger asChild>
            <motion.button
              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 
                       text-white px-8 py-4 rounded-xl font-semibold text-base transition-colors 
                       flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-5 h-5" />
              View Incentivized Pools
            </motion.button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
            <Dialog.Content
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                       bg-adamant-app-box rounded-xl p-6 w-full max-w-lg z-50 max-h-[80vh] overflow-y-auto
                       shadow-2xl border border-gray-700"
            >
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-white font-semibold text-xl">
                  Incentivized Pools
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="space-y-4">
                {stakingPools.map((pool) => {
                  // Parse the pair symbol to get individual token symbols
                  const [token0Symbol, token1Symbol] = pool.pairSymbol.split('/');

                  return (
                    <motion.div
                      key={pool.poolAddress}
                      className="bg-adamant-app-box-lighter p-5 rounded-xl border border-yellow-500/20 
                               hover:border-yellow-500/40 transition-all duration-200"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="text-white font-semibold text-lg">
                            {token0Symbol}/{token1Symbol}
                          </div>
                          <div className="text-sm text-gray-400">
                            Earn{' '}
                            <span className="text-yellow-400 font-medium">
                              {pool.stakingInfo.rewardTokenSymbol}
                            </span>{' '}
                            rewards
                          </div>
                        </div>
                        <Link
                          href={`/pool/${pool.poolAddress}`}
                          className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 
                                   text-white px-4 py-2.5 rounded-lg font-medium transition-colors 
                                   flex items-center gap-2 shadow-md hover:shadow-lg"
                          onClick={() => setIsOpen(false)}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Go
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700">
                <p className="text-gray-400 text-sm text-center leading-relaxed">
                  More incentivized pools coming soon! Follow our updates for the latest
                  opportunities.
                </p>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
};

export default StakingPoolSelector;
