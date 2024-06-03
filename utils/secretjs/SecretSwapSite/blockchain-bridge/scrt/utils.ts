import { decode } from 'bech32';
import cogoToast from 'cogo-toast';
import { ExecuteResult } from 'secretjs';
import { StdFee } from 'secretjs/types/types';
import { Tokens } from 'stores/Tokens';
import { GAS_FOR_BASE_SWAP_ROUTE, GAS_FOR_SWAP_DIRECT } from 'utils/gasPrices';
import { EXCHANGE_MODE, TOKEN } from '../../stores/interfaces';
import { NETWORKS } from '../eth/networks';

const HRP = 'secret';

export const swapContractAddress = (network: NETWORKS): string => {
  switch (network) {
    case NETWORKS.ETH:
      return globalThis.config.SCRT_SWAP_CONTRACT;
    case NETWORKS.BSC:
      return globalThis.config.BSC_SCRT_SWAP_CONTRACT;
    case NETWORKS.PLSM:
      return globalThis.config.PLSM_SWAP_CONTRACT;
  }
};

export const getScrtAddress = (address: string): string => {
  try {
    const decoded = decode(address, 46);
    return decoded.prefix === HRP ? address : '';
  } catch {
    return '';
  }
};

export const validateBech32Address = (address: string): boolean => {
  return getScrtAddress(address) !== '';
};

export function extractValueFromLogs(txResult: ExecuteResult, key: string, lastValue?: boolean): string {
  const wasmLogsReadonly = txResult?.logs[0]?.events?.find(e => e.type === 'wasm')?.attributes;
  let wasmLogs = Array.from(wasmLogsReadonly ?? []);

  if (lastValue) {
    wasmLogs = wasmLogs.reverse();
  }

  return wasmLogs?.find(a => a.key === key)?.value;
}

const gasPriceUscrt = 0.25;
export function getFeeForExecute(gas: number): StdFee {
  return {
    amount: [{ amount: String(Math.floor(gas * gasPriceUscrt) + 1), denom: 'uscrt' }],
    gas: String(gas),
  };
}

export function getFeeForExecuteUSD(numHops: number, tokens: Tokens): number {
  if(numHops === 1)
    var gas = GAS_FOR_SWAP_DIRECT;
  else
    var gas = numHops * GAS_FOR_BASE_SWAP_ROUTE;

  return Number(tokens.getTokenBySymbol('sSCRT').price) * gas / 1_000_000 * gasPriceUscrt;
}

// Cache fees by numHops so we don't have to recompute as often
export function cacheFeesForExecuteUSD(tokens: Tokens): number[] {
  return [
    0,
    getFeeForExecuteUSD(1, tokens),
    getFeeForExecuteUSD(2, tokens),
    getFeeForExecuteUSD(3, tokens),
    getFeeForExecuteUSD(4, tokens),
  ]
}

// todo: fix this up - proxy token
export const secretTokenName = (mode: EXCHANGE_MODE, token: TOKEN, label: string): string => {
  if (label === 'SEFI') {
    return 'SEFI';
  } else if (label === 'WSCRT') {
    return mode === EXCHANGE_MODE.FROM_SCRT ? 'SSCRT' : 'WSCRT';
  } else if (label === 'WSIENNA') {
    return mode === EXCHANGE_MODE.FROM_SCRT ? 'SIENNA' : 'WSIENNA';
  } else {
    return (mode === EXCHANGE_MODE.FROM_SCRT && token === TOKEN.ERC20 ? 'secret' : '') + label;
  }
};

export function notify(
  type: 'success' | 'error' | 'errorWithHash',
  msg: string,
  hideAfterSec: number = 120,
  txHash?: string,
  useContainer: boolean = false,
) {
  // if(globalThis.config.IS_MAINTENANCE === 'true') return;
  let cogoType: string = type;
  if (type === 'error' && typeof(msg) === 'string') {
    msg = msg.replaceAll('Failed to decrypt the following error message: ', '');
    msg = msg.replace(/\. Decryption error of the error message:.+?/, '');
  }

  let onClick = () => {
    hide();
  };
  if (type === 'errorWithHash') {
    cogoType = 'warn';
    onClick = () => {
      const url = `https://secretnodes.com/secret/chains/secret-4/transactions/${txHash}`;
      const win = window.open(url, '_blank');
      win.focus();
      hide();
    };
  }

  const { hide } = cogoToast[cogoType](msg, {
    toastContainerID: 'notifications_container',
    hideAfter: hideAfterSec,
    onClick,
  });
  // NotificationManager[type](undefined, msg, closesAfterMs);
}

export const extractError = (result: any) => {
  if (result?.raw_log && result.raw_log.includes('Operation fell short of expected_return')) {
    return 'Swap fell short of expected return (slippage error)';
  }
  if (result?.raw_log) {
    return result.raw_log;
  }
  console.error(result);
  return `Unknown error`;
};
