// Router types

// TODO: Check if this structure is correct.
type Token = { snip20_data: Snip20Data } | { scrt: null };

export interface Snip20Data {
  address: string;
  code_hash: string;
}

// Execute

export type ExecuteMsg =
  | {
      register_tokens: {
        tokens: Snip20Data[];
      };
    }
  | {
      recover_funds: {
        token: Token;
        amount: string;
        to: string;
        snip20_send_msg?: string;
      };
    };

// Query

export type QueryMsg = { supported_tokens: {} };
