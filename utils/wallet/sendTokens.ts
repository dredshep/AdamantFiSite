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

    // Debug: Log the received parameters
    console.log('🔍 SEND TOKENS DEBUG - Input parameters:', {
      fromAddress,
      toAddress,
      amount,
      denom,
      amountType: typeof amount,
      amountLength: amount.length,
      amountTrimmed: amount.trim(),
    });

    let finalAmount = amount;
    if (denom === 'uscrt') {
      const trimmedAmount = amount.trim();
      const scrtAmount = parseFloat(trimmedAmount);

      console.log('🔍 SEND TOKENS DEBUG - SCRT conversion:', {
        originalAmount: amount,
        trimmedAmount,
        scrtAmount,
        isNaN: isNaN(scrtAmount),
        multiplication: scrtAmount * 1_000_000,
        mathFloor: Math.floor(scrtAmount * 1_000_000),
      });

      if (isNaN(scrtAmount)) {
        throw new Error(`Invalid amount format: "${amount}"`);
      }

      if (scrtAmount <= 0) {
        throw new Error(`Amount must be greater than 0: ${scrtAmount}`);
      }

      finalAmount = Math.floor(scrtAmount * 1_000_000).toString();
    }

    console.log('🔍 SEND TOKENS DEBUG - Final transaction data:', {
      finalAmount,
      finalAmountType: typeof finalAmount,
      denom,
      transactionData: {
        from_address: fromAddress,
        to_address: toAddress,
        amount: [
          {
            amount: finalAmount,
            denom,
          },
        ],
      },
    });

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
