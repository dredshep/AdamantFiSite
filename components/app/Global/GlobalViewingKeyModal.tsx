import { useViewingKeyModalStore } from '@/store/viewingKeyModalStore';
import ViewingKeyMiniCreator from '../Shared/ViewingKeys/ViewingKeyMiniCreator';

/**
 * Global viewing key modal component.
 * Add this once to _app.tsx and it handles all viewing key modals app-wide.
 */
export const GlobalViewingKeyModal = () => {
  const { isOpen, token, handleSuccess, handleError, close } = useViewingKeyModalStore();

  if (!token) return null;

  return (
    <ViewingKeyMiniCreator
      token={token}
      isOpen={isOpen}
      onClose={close}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
};

export default GlobalViewingKeyModal;
