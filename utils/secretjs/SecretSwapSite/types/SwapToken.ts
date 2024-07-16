// import { ITokenInfo } from "../../../stores/interfaces";
// import {
//   Snip20TokenInfo,
//   validateBech32Address,
// } from "../../../blockchain-bridge";
// import { tokenImages } from "../../../components/Earn/EarnRow";
// import { sleep } from "utils";
// import useGlobalConfigStore from "@/store/useGlobalConfigStore";

import { Token } from "@/types";

export type SwapTokenMap = Map<string, SwapToken>;

export type SwapToken = {
  symbol: string;
  logo?: string;
  identifier?: string;
  decimals?: number;
  address?: string;
  name?: string;
  balance?: string;
  price?: number;
};

// export const getPricesForJSONTokens = async () => {
//   const storePrices = useGlobalConfigStore((state) => state.PRICE_DATA);
//   for (let i = 0; i < 4; i++) {
//     if (globalThis.config["PRICE_DATA"]["SEFI/USDT"].price) {
//       break;
//     }
//     await sleep(1000);
//   }
//   return {
//     secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt:
//       globalThis.config["PRICE_DATA"]["SEFI/USDT"].price,
//     uscrt: globalThis.config["PRICE_DATA"]["SCRT/USD"].price,
//     secret1yxcexylwyxlq58umhgsjgstgcg2a0ytfy4d9lt:
//       globalThis.config["PRICE_DATA"]["BUTT/USD"].price,
//     secret14mzwd0ps5q277l20ly2q3aetqe3ev4m4260gf4:
//       globalThis.config["PRICE_DATA"]["ATOM/USD"].price,
//     secret1zwwealwm0pcl9cul4nt6f38dsy6vzplw8lp3qg:
//       globalThis.config["PRICE_DATA"]["OSMO/USD"].price,
//     secret1k8cge73c3nh32d4u0dsd5dgtmk63shtlrfscj5:
//       globalThis.config["PRICE_DATA"]["DVPN/USD"].price,
//     secret19ungtd2c7srftqdwgq0dspwvrw63dhu79qxv88:
//       globalThis.config["PRICE_DATA"]["XMR/USD"].price,
//   };
// };

export const SwapTokenFromSnip20Params = (address: string, token: Token) => {
  const customTokenInfo: SwapToken = {
    symbol: token.symbol,
    address: address,
    decimals: token.decimals,
    logo: "/static/unknown.png",
    identifier: address,
    name: token.name,
  };

  return customTokenInfo;
};

// export const TokenMapfromITokenInfo = async (tokens: ITokenInfo[]): Promise<SwapTokenMap> => {
//   const swapTokens: SwapTokenMap = new Map<string, SwapToken>();

//   const tokenPrices =  await getPricesForJSONTokens()

//   for (const t of tokens) {
//     const secretAddress = validateBech32Address(t.dst_address)
//       ? t.dst_address
//       : validateBech32Address(t.src_address)
//       ? t.src_address
//       : '';
//     let symbol;
//     if (t.display_props.symbol === 'SCRT') {
//       symbol = 'SCRT';
//     } else if (t.display_props.symbol.toLowerCase() === 'sscrt') {
//       symbol = 'sSCRT';
//     } else if (t.display_props.symbol.toLowerCase() === 'sefi') {
//       symbol = 'SEFI';
//     } else if (t.display_props.symbol.toLowerCase() === 'sienna') {
//       symbol = t.display_props.symbol.toUpperCase();
//     } else if (t.display_props.symbol.toLowerCase() === 'alter') {
//       symbol = t.display_props.symbol.toUpperCase();
//     } else if (t.display_props.symbol.toLowerCase() === 'shd') {
//       symbol = t.display_props.symbol.toUpperCase();
//     } else {
//       symbol = 's' + t.display_props.symbol;
//     }

//     const swapToken: SwapToken = {
//       identifier: secretAddress,
//       symbol: symbol,
//       logo: t.display_props.symbol.startsWith("lp-") ? t.display_props.image : tokenImages[t.display_props.symbol.toUpperCase()],
//       decimals: Number(t.decimals),
//       name: t.name,
//       address: secretAddress,
//       price: secretAddress === 'secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt' ? tokenPrices[secretAddress] : (Number(t.price) ? Number(t.price) : 0),
//     };

//     swapTokens.set(swapToken.identifier, swapToken);
//   }

//   return swapTokens;
// };
