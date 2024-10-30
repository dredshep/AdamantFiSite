export interface PoolQueryResponse {
  assets: {
    info: {
      token: {
        contract_addr: string;
        token_code_hash: string;
        viewing_key: string;
      };
    };
    amount: string;
  }[];
  total_share: string;
}
