import { SecretString } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import { QRCodeSVG } from 'qrcode.react';
import { RiFileCopyLine } from 'react-icons/ri';
import { toast } from 'react-toastify';

interface ReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: SecretString;
}

export const ReceiveDialog = ({ open, onOpenChange, walletAddress }: ReceiveDialogProps) => {
  const copyAddressToClipboard = () => {
    void navigator.clipboard.writeText(walletAddress).then(() => {
      toast.success('Address copied to clipboard!');
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-adamant-app-box bg-opacity-50 rounded-2xl p-8 w-[420px] shadow-[0_0_40px_-4px_rgba(167,142,90,0.15)] border border-adamant-gradientBright/20 backdrop-blur-xl">
          <Dialog.Title className="text-2xl font-bold mb-8 bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark bg-clip-text text-transparent">
            Receive Tokens
          </Dialog.Title>

          <div className="space-y-8">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-adamant-gradientBright to-adamant-gradientDark p-[1px] rounded-2xl shadow-[0_0_20px_-4px_rgba(167,142,90,0.3)]">
                <div className="bg-adamant-box-veryDark p-6 rounded-2xl">
                  <QRCodeSVG
                    value={walletAddress}
                    size={200}
                    level="H"
                    includeMargin
                    className="w-48 h-48"
                    bgColor="transparent"
                    fgColor="#cfd0d2"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-adamant-accentText font-medium mb-2">
                Your Address
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={walletAddress}
                  readOnly
                  className="w-full bg-adamant-app-input/50 backdrop-blur-sm border border-adamant-gradientBright/20 rounded-xl px-4 py-3 pr-12 text-white font-mono text-sm outline-none transition-all duration-200 hover:bg-adamant-app-input/70 focus:bg-adamant-app-input/90 focus:border-adamant-gradientBright/30"
                />
                <button
                  onClick={copyAddressToClipboard}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-adamant-accentText hover:text-white transition-colors duration-200 p-1.5 rounded-lg hover:bg-white/5"
                >
                  <RiFileCopyLine className="w-5 h-5" />
                </button>
              </div>
            </div>
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
