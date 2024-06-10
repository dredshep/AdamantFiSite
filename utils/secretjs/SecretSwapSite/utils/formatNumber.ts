import { BigNumber } from 'bignumber.js';
const BN = require('bn.js');

//https://stackoverflow.com/questions/9461621/format-a-number-as-2-5k-if-a-thousand-or-more-otherwise-900
export const nFormatter = (num, digits) => {
  const si = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'K' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(digits).replace(rx, '$1') + si[i].symbol;
};

export const numberFormatter = (num, digits) => {
  const si = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'K' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'B' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'Q' },
    { value: 1e18, symbol: 'Qi' },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(digits).replace(rx, '$1') + ' ' + si[i].symbol;
};

export const toFixedTrunc = (x, n) => {
  const v = (typeof x === 'string' ? x : x.toString()).split('.');
  if (n <= 0) return v[0];
  let f = v[1] || '';
  if (f.length > n) return `${v[0]}.${f.substr(0, n)}`;
  while (f.length < n) f += '0';
  return `${v[0]}.${f}`;
};

export const balanceNumberFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6,
  useGrouping: true,
});

export const valueToDecimals = (input: string, numDecimalsInResult: number): string => {
  let numDecimalsInInput;
  const decimalPos = input.indexOf('.');

  if (decimalPos !== -1) {
    numDecimalsInInput = input.length - decimalPos - 1;
  } else {
    // No decimal point in the string
    numDecimalsInInput = 0;
  }

  let result = input.replace('.', '');

  if (numDecimalsInResult >= numDecimalsInInput) {
    result += '0'.repeat(numDecimalsInResult - numDecimalsInInput);
  } else {
    // This situation may never happen.  It's when the input has more decimal places than the result should have.
    result = result.slice(0, numDecimalsInResult - numDecimalsInInput);
  }

  return result;
};

export const zeroDecimalsFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatZeroDecimals(value: number | string) {
  return zeroDecimalsFormatter.format(Number(value));
}

const twoDecimalsFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const sixDecimalsFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6,
});

export function formatWithTwoDecimals(value: number | string) {
  return twoDecimalsFormatter.format(Number(value));
}

export function formatWithSixDecimals(value: number | string) {
  return sixDecimalsFormatter.format(Number(value));
}

export function formatWithTwoDecimalsRub(value: number) {
  return `${formatWithTwoDecimals(value)} ₽`;
}

/**
 * This function will chop off decimals, but not chop off integers,
 * so that there are no more than `sigFigs` digits, unless there are a lot of integer digits.
 * Examples with sigFigs=6:
 * 1.234567 => 1.23457
 * 123.456789 => 123.457
 * 123456789.123456 => 123456789
 */
export function formatSignificantFigures(value: number | string | BigNumber, sigFigs: number) {
  value = Number(value);

  let maxFractionDigits = sigFigs - 1 - Math.floor(Math.log10(Math.abs(value)));
  maxFractionDigits = Math.max(0, maxFractionDigits);
  maxFractionDigits = Math.min(20, maxFractionDigits);

  return new Intl.NumberFormat('en-US', {maximumFractionDigits: maxFractionDigits}).format(value);
}

export function formatAsUSD(value: number | string | BigNumber) {
  return '$' +
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  .format(Number(value)) +
  ' USD';
}

export function ones(value: number | string) {
  return Number(value) / 1e18;
}

export function truncateSymbol(symbol: string, num: number = 6) {
  if (!symbol) {
    return '';
  }

  if (symbol.length <= 6) {
    return symbol;
  }

  const first = symbol.slice(0, num);
  return `${first}..`;
}

export function truncateAddressString(address: string, num = 12) {
  if (!address) {
    return '';
  }

  const first = address.slice(0, num);
  const last = address.slice(-num);
  return `${first}...${last}`;
}

export const sortedStringify = (obj: any) => JSON.stringify(obj, Object.keys(obj).sort());

export const mulDecimals = (amount: string | number, decimals: string | number) => {
  const decimalsMul = `10${new Array(Number(decimals)).join('0')}`;
  const amountStr = new BigNumber(amount).multipliedBy(decimalsMul);

  return new BN(amountStr.toFixed());
};

export const divDecimals = (amount: string | number, decimals: string | number) => {
  if (decimals === 0) {
    return String(amount);
  }

  const decimalsMul = `10${new Array(Number(decimals)).join('0')}`;
  const amountStr = new BigNumber(amount).dividedBy(decimalsMul);

  return amountStr.toFixed();
};

export const UINT128_MAX = '340282366920938463463374607431768211454';

export const displayHumanizedBalance = (
  balance: BigNumber,
  roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP,
  decimals: number = 6,
): string =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    useGrouping: true,
  }).format(Number(balance.toFixed(decimals, roundingMode)));

export const humanizeBalance = (balance: BigNumber, decimals: number): BigNumber =>
  balance.dividedBy(new BigNumber(`1e${decimals}`));

export const canonicalizeBalance = (balance: BigNumber, decimals: number): BigNumber =>
  balance.multipliedBy(new BigNumber(`1e${decimals}`));
