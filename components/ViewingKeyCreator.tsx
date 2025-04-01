import { getSecretNetworkEnvVars } from '@/utils/env';
import React, { useState } from 'react';
import { BroadcastMode, SecretNetworkClient, TxResultCode } from 'secretjs';
const { CHAIN_ID } = getSecretNetworkEnvVars();
interface ViewingKeyCreatorProps {
  secretjs: SecretNetworkClient | null;
  contractAddress: string;
  contractHash: string;
  onSuccess: (txHash: string) => void;
  onError: (error: Error) => void;
}

const ViewingKeyCreator: React.FC<ViewingKeyCreatorProps> = ({
  secretjs,
  contractAddress,
  contractHash,
  onSuccess,
  onError,
}) => {
  const [customKey, setCustomKey] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUsingCustomKey, setIsUsingCustomKey] = useState(false);

  const generateRandomKey = () => {
    // Generate a secure random key
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const createViewingKey = async (viewingKey?: string) => {
    if (!secretjs) {
      onError(new Error('Secret Network client not connected'));
      return;
    }

    try {
      setIsCreating(true);

      // Use provided key or generate one
      const keyToUse = viewingKey ?? (isUsingCustomKey ? customKey : generateRandomKey());

      // Create the message to set the viewing key
      const setViewingKeyMsg = {
        set_viewing_key: {
          key: keyToUse,
        },
      };

      console.log(`Creating viewing key for contract ${contractAddress}`);

      // Execute the transaction
      const result = await secretjs.tx.compute.executeContract(
        {
          sender: secretjs.address,
          contract_address: contractAddress,
          code_hash: contractHash,
          msg: setViewingKeyMsg,
          sent_funds: [],
        },
        {
          gasLimit: 150_000,
          broadcastCheckIntervalMs: 1000,
          broadcastTimeoutMs: 60_000,
          broadcastMode: BroadcastMode.Sync,
        }
      );

      console.log('Transaction result:', result);

      // Check if the transaction was successful
      if ('code' in result && result.code === TxResultCode.Success) {
        console.log('Viewing key created successfully');

        // Pass transaction hash to parent component
        if ('transactionHash' in result) {
          onSuccess(result.transactionHash);
        }

        // Now handle the viewing key in Keplr, even though this is hard with Keplr
        try {
          if (window.keplr && CHAIN_ID) {
            // Just try to refresh Keplr connection
            console.log('Refreshing Keplr connection...');
            await window.keplr.disable(CHAIN_ID);
            await window.keplr.enable(CHAIN_ID);

            // Suggest the token again with the code hash to ensure it's properly registered
            console.log(`Re-suggesting token ${contractAddress} with code hash: ${contractHash}`);
            await window.keplr.suggestToken(CHAIN_ID, contractAddress, contractHash);
          }
        } catch (keplrError) {
          console.error('Keplr refresh error:', keplrError);
        }
      } else {
        const errorLog =
          'rawLog' in result && typeof result.rawLog === 'string' ? result.rawLog : 'Unknown error';
        throw new Error(`Failed to set viewing key: ${errorLog}`);
      }
    } catch (error) {
      console.error('Error creating viewing key:', error);
      onError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
      <h3 className="text-white font-semibold text-lg mb-3">Create Viewing Key</h3>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="custom-key"
            checked={isUsingCustomKey}
            onChange={() => setIsUsingCustomKey(!isUsingCustomKey)}
            className="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="custom-key" className="text-gray-300">
            Use custom viewing key
          </label>
        </div>

        {isUsingCustomKey && (
          <div>
            <input
              type="text"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="Enter your preferred viewing key"
              className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              For security, use a strong, unique key (at least 16 characters).
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => void createViewingKey()}
            disabled={isCreating || (isUsingCustomKey && !customKey)}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:bg-gray-700 disabled:text-gray-500"
          >
            {isCreating
              ? 'Creating...'
              : isUsingCustomKey
              ? 'Create with Custom Key'
              : 'Create Random Key'}
          </button>

          <button
            onClick={() =>
              window.open(
                `https://react.secret.webconsole.so/contract/${contractAddress}`,
                '_blank'
              )
            }
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
          >
            View on Secret Explorer
          </button>
        </div>
      </div>

      <div className="mt-4 text-sm text-amber-300">
        <p>
          After creating a viewing key, you'll need to manually add this token to Keplr. Click the
          Keplr extension icon and add the token to see the balance.
        </p>
      </div>
    </div>
  );
};

export default ViewingKeyCreator;
