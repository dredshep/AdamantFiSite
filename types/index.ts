export type SecretString = `secret1${string}`;

export interface Token {
  symbol: string;
  address: SecretString;
}
