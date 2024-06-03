<!-- import {queryFactoryConfig} from '@shadeprotocol/shadejs'

async function main () {
	const config = await queryFactoryConfig({
		contractAddress: "secret1fjqlk09wp7yflxx7y433mkeskqdtw3yqerkcgp",
		chainId: "secret-4",
		codeHash
	})
} -->

```ts
/**
 * returns output of a simulated swap of token1 for
 * token0 using the stableswap math
 * inputs token amounts must be passsed in as human readable form
 * */
function stableSwapToken1for0({
  inputToken1Amount,
  poolToken0Amount,
  poolToken1Amount,
  priceRatio,
  alpha,
  gamma1,
  gamma2,
  liquidityProviderFee,
  daoFee,
  minTradeSizeToken0For1,
  minTradeSizeToken1For0,
  priceImpactLimit,
}: {
  inputToken1Amount: BigNumber;
  poolToken0Amount: BigNumber;
  poolToken1Amount: BigNumber;
  priceRatio: BigNumber;
  alpha: BigNumber;
  gamma1: BigNumber; // gamma params control the shape of the stable curve (concentrated liquidity like stableswap..)
  gamma2: BigNumber; // gamma params control the shape of the stable curve
  liquidityProviderFee: BigNumber; // decimal percent
  daoFee: BigNumber; // decimal percent
  minTradeSizeToken0For1: BigNumber;
  minTradeSizeToken1For0: BigNumber;
  priceImpactLimit: BigNumber;
});

/*
 * Queries the configuration for the swap factory
 */
async function queryFactoryConfig({
  contractAddress,
  codeHash,
  // LCD ENDPOINTS: https://docs.scrt.network/secret-network-documentation/development/resources-api-contract-addresses/connecting-to-the-network/mainnet-secret-4
  lcdEndpoint,
  chainId,
}: {
  contractAddress: string;
  codeHash?: string; //  ./secretcli q compute contract-hash secret1fjqlk09wp7yflxx7y433mkeskqdtw3yqerkcgp
  lcdEndpoint?: string; // https://rpc.ankr.com/http/scrt_cosmos
  chainId?: string; // defaults to mainnet (secret-4)
}): Promise<FactoryConfig>;
```
