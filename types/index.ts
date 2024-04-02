export type HexString = `0x${string}`;

export interface Token {
  symbol: string;
  address: HexString;
}
