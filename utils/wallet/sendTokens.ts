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

    // Execute the send transaction
    const tx = await secretjs.tx.bank.send(
      {
        from_address: fromAddress,
        amount: [
          {
            amount,
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
