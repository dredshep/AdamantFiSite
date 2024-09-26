export interface Hop {
  from_token:
    | {
        snip20: {
          address: string;
          code_hash: string;
        };
      }
    | "scrt";
  pair_address: string;
  pair_code_hash: string;
  expected_return?: string;
}
