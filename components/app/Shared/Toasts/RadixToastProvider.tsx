'use client';

import { removeToast, subscribeToToasts } from '@/utils/toast/toastManager';
import * as Toast from '@radix-ui/react-toast';
import { useEffect, useState } from 'react';
import CustomToast from './CustomToast';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  autoClose?: number | false;
  createdAt: number;
}

export function RadixToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts(setToasts);
    return unsubscribe;
  }, []);

  const handleClose = (toastId: string) => {
    removeToast(toastId);
  };

  return (
    <Toast.Provider swipeDirection="right" duration={6000}>
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          className="radix-toast-root"
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              handleClose(toast.id);
            }
          }}
          duration={toast.autoClose === false ? Infinity : toast.autoClose || 6000}
        >
          <CustomToast
            type={toast.type}
            title={toast.title}
            {...(toast.message && { message: toast.message })}
            {...(toast.actionLabel && { actionLabel: toast.actionLabel })}
            {...(toast.onAction && { onAction: toast.onAction })}
            onClose={() => handleClose(toast.id)}
          />
        </Toast.Root>
      ))}

      <Toast.Viewport className="fixed bottom-0 right-0 flex flex-col p-6 gap-2 w-96 max-w-[100vw] m-0 list-none z-[100] outline-none" />
    </Toast.Provider>
  );
}
