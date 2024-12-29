import { useTokenStore } from '@/store/tokenStore';
import { SecretString } from '@/types';
import { getApiTokenAddress, getApiTokenSymbol } from '@/utils/apis/getSwappableTokens';
import { sendTokens } from '@/utils/wallet/sendTokens';
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { toast } from 'react-toastify';

interface SendTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: SecretString;
}

export const SendTokensDialog = ({ open, onOpenChange, walletAddress }: SendTokensDialogProps) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('uscrt');
  const { listAllTokens } = useTokenStore();
  const tokens = listAllTokens() ?? [];

  const handleSend = async () => {
    try {
      if (!recipientAddress || !amount) {
        toast.error('Please fill in all fields');
        return;
      }

      await sendTokens({
        fromAddress: walletAddress,
        toAddress: recipientAddress as SecretString,
        amount,
        denom: selectedToken,
      });

      toast.success('Transaction submitted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to send tokens');
      console.error(error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-adamant-app-box bg-opacity-50 rounded-2xl p-8 w-[420px] shadow-[0_0_40px_-4px_rgba(167,142,90,0.15)] border border-adamant-gradientBright/20 backdrop-blur-xl">
          <Dialog.Title className="text-2xl font-bold mb-8 bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark bg-clip-text text-transparent">
            Send Tokens
          </Dialog.Title>

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-adamant-accentText font-medium mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full bg-adamant-app-input/50 backdrop-blur-sm border border-adamant-gradientBright/20 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none transition-all duration-200 hover:bg-adamant-app-input/70 focus:bg-adamant-app-input/90 focus:border-adamant-gradientBright/30"
                placeholder="secret1..."
              />
            </div>

            <div>
              <label className="block text-sm text-adamant-accentText font-medium mb-2">
                Amount
              </label>
              <div className="relative group">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-adamant-app-input/50 backdrop-blur-sm border border-adamant-gradientBright/20 rounded-xl px-4 py-3 pr-24 text-white font-mono text-sm outline-none transition-all duration-200 hover:bg-adamant-app-input/70 focus:bg-adamant-app-input/90 focus:border-adamant-gradientBright/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.0"
                />
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-adamant-app-input/70 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white border border-adamant-gradientBright/20 outline-none transition-all duration-200 hover:bg-adamant-app-input/90 focus:border-adamant-gradientBright/30 cursor-pointer text-sm font-medium"
                >
                  <option value="uscrt">SCRT</option>
                  {tokens.map((token, index) => (
                    <option key={index} value={getApiTokenAddress(token)}>
                      {getApiTokenSymbol(token)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => void handleSend()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark text-black font-bold uppercase hover:from-adamant-gradientDark hover:to-adamant-gradientBright transition-all duration-300 mt-4 shadow-[0_0_20px_-4px_rgba(167,142,90,0.3)]"
            >
              Send
            </button>
          </div>

          <Dialog.Close asChild>
            <button className="absolute top-6 right-6 text-adamant-accentText hover:text-white transition-colors duration-200 p-2 rounded-lg hover:bg-white/5">
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
