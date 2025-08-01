import { useModalStore } from '@/store/modalStore';
import { useWalletStore } from '@/store/walletStore';
import React from 'react';
import { SendTokensDialog } from './SendTokensDialog';

/**
 * Global SendTokensDialog that can be controlled from anywhere in the app
 * via the modal store. This allows SmartSearch to trigger send dialogs.
 */
export const GlobalSendTokensDialog: React.FC = () => {
  const { address } = useWalletStore();
  const { sendTokensDialog, closeSendTokensDialog } = useModalStore();

  // Don't render if user is not connected
  if (!address) {
    return null;
  }

  return (
    <SendTokensDialog
      open={sendTokensDialog.isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeSendTokensDialog();
        }
      }}
      walletAddress={address}
      {...(sendTokensDialog.prefillData && { prefillData: sendTokensDialog.prefillData })}
    />
  );
};
