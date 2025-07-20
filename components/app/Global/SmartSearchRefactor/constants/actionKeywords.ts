// Action keywords configuration
export const ACTION_KEYWORDS = {
  swap: ['swap', 'exchange', 'trade', 'convert'],
  pool: ['pool', 'liquidity', 'lp'],
  stake: ['stake', 'staking', 'earn', 'reward'],
  deposit: ['deposit', 'add', 'provide'],
  withdraw: ['withdraw', 'remove', 'unstake'],
  send: ['send', 'transfer', 'pay'],
  receive: ['receive', 'address', 'wallet'],
} as const;

export type ActionType = keyof typeof ACTION_KEYWORDS;
