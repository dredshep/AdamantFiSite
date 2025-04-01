// TODO: proper error handling

export function getCodeHashByAddress(contractAddress: string) {
  const token = tokens.find((token) => token.contract_addr === contractAddress);
  if (token) {
    return token.token_code_hash;
  } else {
    return '';
  }
}

// NOTE: These are the only possible tokens to swap at the moment.

const tokens = [
  {
    contract_addr: 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek',
    token_code_hash: 'af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e',
    viewing_key: 'SecretSwap',
    token_name: 'sSCRT',
    decimals: 6,
  },
  {
    contract_addr: 'secret14mzwd0ps5q277l20ly2q3aetqe3ev4m4260gf4',
    token_code_hash: 'ad91060456344fc8d8e93c0600a3957b8158605c044b3bef7048510b3157b807',
    viewing_key: 'SecretSwap',
    token_name: 'SATOM',
    decimals: 6,
  },
  {
    contract_addr: 'secret1fl449muk5yq8dlad7a22nje4p5d2pnsgymhjfd',
    token_code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    viewing_key: 'SecretSwap',
    token_name: 'SILK',
    decimals: 6,
  },
  {
    contract_addr: 'secret139qfh3nmuzfgwsx2npnmnjl4hrvj3xq5rmq8a0',
    token_code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    viewing_key: 'SecretSwap',
    token_name: 'saWETH',
    decimals: 18,
  },
  {
    contract_addr: 'secret1chsejpk9kfj4vt9ec6xvyguw539gsdtr775us2',
    token_code_hash: '5a085bd8ed89de92b35134ddd12505a602c7759ea25fb5c089ba03c8535b3042',
    viewing_key: 'SecretSwap',
    token_name: 'SNOBLEUSDC',
    decimals: 6,
  },
  {
    contract_addr: 'secret1sgaz455pmtgld6dequqayrdseq8vy2fc48n8y3',
    token_code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    viewing_key: 'SecretSwap',
    token_name: 'sJKL',
    decimals: 6,
  },
];

export const FactoryTokens = tokens;
