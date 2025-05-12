import { SecretString } from '@/types';

export type ConfigToken = {
  name: string;
  symbol: string;
  address: SecretString;
  codeHash: string;
  decimals: number;
};

export type LiquidityPair = {
  symbol: string;
  token0: string;
  token1: string;
  pairContract: SecretString;
  lpToken: SecretString;
  pairContractCodeHash: string;
  lpTokenCodeHash: string;
};

export type StakingContract = {
  pairSymbol: string;
  stakingContract: SecretString;
  codeId: number;
  rewardTokenSymbol: string;
  codeHash: string;
};

export type Factory = {
  contract_address: SecretString;
  code_hash: string;
};

export const TOKENS: ConfigToken[] = [
  {
    name: 'Secret Secret',
    symbol: 'sSCRT',
    address: 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek',
    codeHash: 'af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e',
    decimals: 6,
  },
  {
    name: 'idk',
    symbol: 'sATOM',
    address: 'secret14mzwd0ps5q277l20ly2q3aetqe3ev4m4260gf4',
    codeHash: 'ad91060456344fc8d8e93c0600a3957b8158605c044b3bef7048510b3157b807',
    decimals: 6,
  },
  {
    name: 'Silk Stablecoin',
    symbol: 'SILK',
    address: 'secret1fl449muk5yq8dlad7a22nje4p5d2pnsgymhjfd',
    codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    decimals: 6,
  },
  {
    name: 'Secret Axelar WETH',
    symbol: 'ETH.axl',
    address: 'secret139qfh3nmuzfgwsx2npnmnjl4hrvj3xq5rmq8a0',
    codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    decimals: 18,
  },
  {
    name: 'Secret Noble USDC',
    symbol: 'USDC.nbl',
    address: 'secret1chsejpk9kfj4vt9ec6xvyguw539gsdtr775us2',
    codeHash: '5a085bd8ed89de92b35134ddd12505a602c7759ea25fb5c089ba03c8535b3042',
    decimals: 6,
  },
  {
    name: 'Secret Jackal',
    symbol: 'JKL',
    address: 'secret1sgaz455pmtgld6dequqayrdseq8vy2fc48n8y3',
    codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    decimals: 6,
  },
  {
    name: 'bADMT',
    symbol: 'bADMT',
    address: 'secret1cu5gvrvu24hm36fzyq46vca7u25llrymj6ntek',
    codeHash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    decimals: 6,
  },
];

export const LIQUIDITY_PAIRS: LiquidityPair[] = [
  {
    symbol: 'sSCRT/sATOM',
    token0: 'sSCRT',
    token1: 'sATOM',
    pairContract: 'secret1nu0l5pnszp0np349ka0hdmtjctrgd2f5v69ypq',
    lpToken: 'secret1nuz5f9mqk5dp9hsjqxyhxax86jr466rzs5sh0s',
    pairContractCodeHash: '0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490',
    lpTokenCodeHash: '744c588ed4181b13a49a7c75a49f10b84b22b24a69b1e5f3cdff34b2c343e888',
  },
  {
    symbol: 'sSCRT/SILK',
    token0: 'sSCRT',
    token1: 'SILK',
    pairContract: 'secret13v4slrjs086lm46ltpl494awfhaq9kzal5vusu',
    lpToken: 'secret106cdj82hhh8uupew9qegsugzk2tsefhw5qrkkk',
    pairContractCodeHash: '0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490',
    lpTokenCodeHash: '744c588ed4181b13a49a7c75a49f10b84b22b24a69b1e5f3cdff34b2c343e888',
  },
  {
    symbol: 'sSCRT/ETH.axl',
    token0: 'sSCRT',
    token1: 'ETH.axl',
    pairContract: 'secret10jlqxf3zjcyrxlvxfq4v9znzd3g098f39t8rjy',
    lpToken: 'secret10rs5z2x92axlccxdq5pdr0nnnexg09al4tcnct',
    pairContractCodeHash: '0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490',
    lpTokenCodeHash: '744c588ed4181b13a49a7c75a49f10b84b22b24a69b1e5f3cdff34b2c343e888',
  },
  {
    symbol: 'sSCRT/USDC.nbl',
    token0: 'sSCRT',
    token1: 'USDC.nbl',
    pairContract: 'secret1avsx6cnmqqjcnnuu858ak8zkttug7v097jxvzq',
    lpToken: 'secret18xd8j88jrwzagnv09cegv0fm3aca6d3qlfem6v',
    pairContractCodeHash: '0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490',
    lpTokenCodeHash: '744c588ed4181b13a49a7c75a49f10b84b22b24a69b1e5f3cdff34b2c343e888',
  },
  {
    symbol: 'sSCRT/JKL',
    token0: 'sSCRT',
    token1: 'JKL',
    pairContract: 'secret1cku7xy9655clz08qcg94g5j3sm644aa94twt0z',
    lpToken: 'secret1ex9cm7l8w0xxchptykqsc2vdr79pk3nrm0sxj3',
    pairContractCodeHash: '0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490',
    lpTokenCodeHash: '744c588ed4181b13a49a7c75a49f10b84b22b24a69b1e5f3cdff34b2c343e888',
  },
] as const;

export const STAKING_CONTRACTS: StakingContract[] = [
  {
    pairSymbol: 'sSCRT/USDC.nbl',
    stakingContract: 'secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev',
    codeId: 2276,
    rewardTokenSymbol: 'bADMT',
    codeHash: 'c644edd309de7fd865b4fbe22054bcbe85a6c0b8abf5f110053fe1b2d0e8a72a',
  },
];

// {"contract_address":"secret18reusruqrq7a0ug4vn6ue2pg59lm2dtsqxu6f3","contract_info":{"code_id":"30","creator":"secret16zvp2t86hdv5na3quygc9f2rnn9f9l4vszgtue","label":"secretswap-factory-3","created":{"block_height":"19549431","tx_index":"0"},"ibc_port_id":"","admin":"secret1kh0x34l6z66zty6j0cafn0j3fgs20aytulew52","admin_proof":null}}
export const FACTORY: Factory = {
  contract_address: 'secret18reusruqrq7a0ug4vn6ue2pg59lm2dtsqxu6f3',
  code_hash: '16ea6dca596d2e5e6eef41df6dc26a1368adaa238aa93f07959841e7968c51bd',
};
