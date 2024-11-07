import { SecretString } from '../SecretString';

export interface PoolQueryResponse {
  assets: {
    info: {
      token: {
        contract_addr: SecretString;
        token_code_hash: string;
        viewing_key: string;
      };
    };
    amount: string;
  }[];
  total_share: string;
}
