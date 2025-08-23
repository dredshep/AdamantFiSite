import { SecretString } from '@/types';
import { TxResultCode } from 'secretjs';
import { initKeplr } from './initKeplr';

interface SendTokensParams {
  fromAddress: SecretString;
  toAddress: SecretString;
  amount: string;
  denom: string;
}

export const sendTokens = async ({ fromAddress, toAddress, amount, denom }: SendTokensParams) => {
  try {
    const { secretjs } = await initKeplr();

    // Convert amount for native SCRT (uscrt denomination)
    // 1 SCRT = 1,000,000 uscrt (6 decimals)
    let finalAmount = amount;
    if (denom === 'uscrt') {
      const scrtAmount = parseFloat(amount);
      if (isNaN(scrtAmount)) {
        throw new Error('Invalid amount format');
      }
      finalAmount = Math.floor(scrtAmount * 1_000_000).toString();
    }

    // Execute the send transaction
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
