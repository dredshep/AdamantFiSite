export type FullPoolsData = {
  pair: string;
  contract_address: string;
  lp_token_contract: string;
  query_result: {
    assets: (
      | {
          info: {
            native_token: {
              denom: string;
            };
            token?: undefined;
          };
          amount: string;
        }
      | {
          info: {
            token: {
              contract_addr: string;
              token_code_hash: string;
              viewing_key: string;
            };
            native_token?: undefined;
          };
          amount: string;
        }
    )[];
    total_share: string;
  };
  code_hash: string;
}[];
