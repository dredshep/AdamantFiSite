import { createWalletClientWithInternalUtils } from '@/hooks/useSecretNetwork';
import { SecretString } from '@/types';
import { SecretNetworkClient, TxResultCode } from 'secretjs';
import { waitForKeplr } from './keplrDetection';

interface SendTokensParams {
  fromAddress: SecretString;
  toAddress: SecretString;
  amount: string;
  denom: string;
}

export const sendTokens = async ({ fromAddress, toAddress, amount, denom }: SendTokensParams) => {
  try {
    const keplr = await waitForKeplr(2300);
    if (!keplr) {
      throw new Error('Please install Keplr extension');
    }

    // Use internal encryption utils for transactions
    let secretjs: SecretNetworkClient;
    try {
      const client = await createWalletClientWithInternalUtils();
      if (!client) {
        throw new Error('Failed to initialize SecretJS client');
      }
      secretjs = client;
    } catch (error) {
      throw new Error(
        `Failed to create SecretJS client: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }

    let finalAmount = amount;
    if (denom === 'uscrt') {
      const scrtAmount = parseFloat(amount);
      if (isNaN(scrtAmount)) {
        throw new Error('Invalid amount format');
      }
      finalAmount = Math.floor(scrtAmount * 1_000_000).toString();
    }

    const tx = await secretjs.tx.bank.send(
      {
        from_address: fromAddress,
        amount: [
          {
            amount: finalAmount,
            denom,
          },
        ],
        to_address: toAddress,
      },
      {
        gasLimit: 50_000,
      }
    );

    if (tx.code !== TxResultCode.Success) {
      throw new Error(`Transaction failed: ${tx.rawLog}`);
    }

    return {
      success: true,
      txHash: tx.transactionHash,
    };
  } catch (error) {
    console.error('Error sending tokens:', error);
    throw error;
  }
};
