import { SecretNetworkClient } from 'secretjs';

const grpcWebUrl = 'https://secret-4.api.trivium.network:9091';
const chainId = 'secret-4';

async function main() {
  const client = new SecretNetworkClient({
    url: grpcWebUrl, // 👈 use "url" here
    chainId, // 👈 not "grpcWebUrl" anymore
  });

  const latest = await client.query.tendermint.getLatestBlock({});
  console.log('Latest block height:', latest.block?.header?.height);
}

void main();
