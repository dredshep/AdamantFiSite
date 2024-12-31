import { SecretString } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import { QRCodeSVG } from 'qrcode.react';
import { RiFileCopyLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { CloseButton } from '../../Shared/CloseButton';

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
              <CloseButton />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
