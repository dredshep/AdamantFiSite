export const wrongNetwork = 'Wrong Network';
export const unlockToken = 'Unlock';
export const fixUnlockToken = 'Fix Unlock';

const gasPriceRatio = 0.25;

export const toUscrtFee = (fee: number): string => {
  return String(Math.floor(fee * gasPriceRatio) + 1);
};
