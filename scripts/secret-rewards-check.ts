import { SecretNetworkClient } from 'secretjs';

// NEXT_PUBLIC_RPC_URL=https://rpc-secret.keplr.app/
// NEXT_PUBLIC_LCD_URL=https://lcd-secret.keplr.app/
const grpcWebUrl = 'https://secret-4.api.trivium.network:9091'; // e.g. https://secret-4.api.trivium.network:9091
const chainId = 'secret-4'; // or pulsar-3 (testnet)
const distributorAddr = 'secret1s563hkkrzjzx9q8qcx3r47h7s0hn5kfgy9t62r';
const stakingContractAddr = 'secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev'; // From config/tokens.ts

async function checkSecretRewards(): Promise<void> {
  try {
    // If you only query, you don't need a wallet. For the optional execute, add a wallet.
    const secretjs = new SecretNetworkClient({ url: grpcWebUrl, chainId });

    // 1) Get code hash of the distributor (don't trust a hardcoded guess)
    const codeHashResponse = await secretjs.query.compute.codeHashByContractAddress({
      contract_address: distributorAddr,
    });
    const distributorHash = codeHashResponse.code_hash;

    if (!distributorHash) {
      throw new Error('Failed to get distributor code hash');
    }

    // 2) Ask distributor which reward token it uses (address + hash)
    interface RewardTokenResponse {
      reward_token: {
        contract: {
          address: string;
          contract_hash: string;
        };
      };
    }

    const rewardTokAns = await secretjs.query.compute.queryContract<
      { reward_token: Record<string, never> },
      RewardTokenResponse
    >({
      contract_address: distributorAddr,
      code_hash: distributorHash,
      query: { reward_token: {} },
    });

    const tokenAddr = rewardTokAns.reward_token.contract.address;
    const tokenHash = rewardTokAns.reward_token.contract.contract_hash;

    // 3) Permit-based balance query for the distributor's own balance
    //    (works even if the contract never set a viewing key)
    const myViewer = 'secret19zrnhu0cj7c2rhwnf59wmhsjcwf7u808zf6ngt'; // signer address that will sign the permit

    const permit = await secretjs.utils.accessControl.permit.sign(
      myViewer, // signer
      chainId, // chain id
      'rewards-check', // permit name (any)
      [tokenAddr], // allowed contracts
      ['owner', 'balance'], // permissions
      false
    );

    // Most convenient helper (SecretJS exposes snip20 helpers):
    const bal = await secretjs.query.snip20.getBalance({
      contract: { address: tokenAddr, code_hash: tokenHash },
      address: distributorAddr, // <-- whose balance we want
      auth: { permit },
    });

    console.log('Distributor balance (raw):', bal.balance?.amount || '0');

    // 4) Check if rewards are pending at current block
    const latest = await secretjs.query.tendermint.getLatestBlock({});
    const height = Number(latest.block?.header?.height ?? 0);

    interface PendingResponseWithNestedAmount {
      pending: {
        amount: {
          amount: string;
        };
      };
    }

    interface PendingResponseWithDirectAmount {
      pending: {
        amount: string;
      };
    }

    type PendingResponse = PendingResponseWithNestedAmount | PendingResponseWithDirectAmount;

    const pending = await secretjs.query.compute.queryContract<
      { pending: { block: number } },
      PendingResponse
    >({
      contract_address: distributorAddr,
      code_hash: distributorHash,
      query: { pending: { block: height } },
    });

    // Type-safe extraction of pending amount
    let pendingRaw = '0';
    if ('pending' in pending && pending.pending) {
      if ('amount' in pending.pending) {
        if (typeof pending.pending.amount === 'string') {
          pendingRaw = pending.pending.amount;
        } else if (
          typeof pending.pending.amount === 'object' &&
          'amount' in pending.pending.amount
        ) {
          pendingRaw = pending.pending.amount.amount;
        }
      }
    }

    console.log('Pending rewards (raw):', pendingRaw);

    // 🎯 CHECK THE STAKING CONTRACT BALANCE (where tokens should actually be!)
    console.log('\n🏦 CHECKING STAKING CONTRACT - THIS IS WHERE THE TOKENS SHOULD BE:');
    console.log('Staking contract address:', stakingContractAddr);

    try {
      // Get staking contract code hash
      const stakingCodeHash = await secretjs.query.compute.codeHashByContractAddress({
        contract_address: stakingContractAddr,
      });
      console.log('Staking contract code hash:', stakingCodeHash.code_hash);

      // Try to query the staking contract's bADMT balance
      // This would require a permit too, but let's at least try some public queries
      console.log('Trying to get staking contract info...');

      // The staking contract might have public queries we can use
      console.log('✅ Successfully found staking contract');
      console.log('Next step: Check if staking contract has bADMT tokens');
      console.log(
        'Note: Balance queries require authentication, but contract should have the tokens'
      );
    } catch (error) {
      console.error('❌ Error querying staking contract:', error);
    }

    // 5) (Optional) If pending > 0 but users still see 0, you may need to trigger allocation:
    //    Requires a signer client (wallet) and gas.
    //// const wallet = new Wallet("<mnemonic>");
    // // const signer = await SecretNetworkClient.create({ grpcWebUrl, chainId, wallet, walletAddress: wallet.address });
    // // const tx = await signer.tx.compute.executeContract({
    // //   sender: wallet.address,
    // //   contract_address: distributorAddr,
    // //   code_hash: distributorHash,
    // //   msg: { update_allocation: {} },
    // // }, { gasLimit: 120_000 });
    // // console.log("update_allocation tx:", tx.code === 0 ? "success" : tx.rawLog);
  } catch (error) {
    console.error('Error checking secret rewards:', error);
    throw error;
  }
}

// Execute the function
checkSecretRewards().catch(console.error);
