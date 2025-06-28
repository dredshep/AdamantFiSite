import { INPUT_STYLES } from '@/components/app/Shared/Forms/Input/inputStyles';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import React, { useState } from 'react';
import SmartSearchBox from './SmartSearchBox';

const MobileSearchButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className="p-2.5 rounded-lg bg-adamant-app-input hover:bg-adamant-app-input/90 border border-adamant-box-inputBorder transition-all duration-200"
          aria-label="Open search"
        >
          <Search className="w-5 h-5 text-adamant-text-box-secondary" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
        </Dialog.Overlay>

        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 left-4 right-4 z-50 max-w-lg mx-auto"
          >
            <div className={`${INPUT_STYLES.infoContainer} p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-adamant-text-box-main">Search</h3>
                <Dialog.Close asChild>
                  <button
                    className="p-1 rounded-lg hover:bg-adamant-app-input/50 transition-colors"
                    aria-label="Close search"
                  >
                    <span className="text-adamant-text-box-secondary text-xl">×</span>
                  </button>
                </Dialog.Close>
              </div>

              <SmartSearchBox
                isMobile={true}
                placeholder="Type a command like 'swap 10 secret for usdc'"
              />
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default MobileSearchButton;
