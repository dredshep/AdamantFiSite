import { queryFactoryConfig } from "@shadeprotocol/shadejs";

async function main() {
  const config = await queryFactoryConfig({
    contractAddress: "secret1fjqlk09wp7yflxx7y433mkeskqdtw3yqerkcgp",
  });
  console.log(config);
}
main();
