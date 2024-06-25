import { sleep } from "../../utils";
import { Keplr } from "@keplr-wallet/types";
// todo: clean this shit up
// import { ERROR_WRONG_VIEWING_KEY } from '../../pages/Swap/utils';

export const ERROR_WRONG_VIEWING_KEY = "Viewing Key Error";

export const getViewingKey = async (params: {
  keplr: Keplr;
  chainId: string;
  address: string;
  currentBalance?: string;
}) => {
  const { keplr, chainId, address, currentBalance } = params;

  if (
    typeof currentBalance === "string" &&
    currentBalance.includes(ERROR_WRONG_VIEWING_KEY)
  ) {
    // In case this tx was set_viewing_key in order to correct the wrong viewing key error
    // Allow Keplr time to locally save the new viewing key
    await sleep(1000);
  }

  let viewingKey: string | undefined = undefined;

  let tries = 0;
  while (true) {
    tries += 1;
    try {
      viewingKey = await keplr.getSecret20ViewingKey(chainId, address);
    } catch (error) {}
    if (viewingKey || tries === 3) {
      break;
    }
    await sleep(100);
  }

  return viewingKey;
};
