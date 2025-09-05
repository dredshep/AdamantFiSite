import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { useLpAndStakingVK } from '@/hooks/useLpAndStakingVK';
import { forceCreateViewingKey } from '@/utils/viewingKeys';
import { NextPage } from 'next';
import { useState } from 'react';

const VKDebugPage: NextPage = () => {
  // sSCRT/USDC.nbl - the only staking pool
  const lpToken = 'secret18xd8j88jrwzagnv09cegv0fm3aca6d3qlfem6v';
  const stakingContract = 'secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev';

  const { secretjs } = useKeplrConnection();
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [keyCreationResult, setKeyCreationResult] = useState<string | null>(null);
  const [isCreatingScrtKey, setIsCreatingScrtKey] = useState(false);
  const [scrtKeyResult, setScrtKeyResult] = useState<string | null>(null);

  const {
    lpToken: lp,
    stakingContract: staking,
    sharedKey,
    refresh,
  } = useLpAndStakingVK(lpToken, stakingContract);

  const formatBalance = (balance: string | null): string => {
    if (!balance) return 'Unknown';
    return (parseFloat(balance) / 1_000_000).toFixed(6);
  };

  const createNewLpViewingKey = async () => {
    if (!secretjs) {
      setKeyCreationResult('Error: Wallet not connected');
      return;
    }

    setIsCreatingKey(true);
    setKeyCreationResult(null);

    try {
      const result = await forceCreateViewingKey({
        secretjs,
        contractAddress: lpToken,
        codeHash: '744c588ed4181b13a49a7c75a49f10b84b22b24a69b1e5f3cdff34b2c343e888', // sSCRT/USDC.nbl LP code hash
        onProgress: (message) => setKeyCreationResult(message),
      });

      if (result.success) {
        const balanceFormatted = result.balance ? formatBalance(result.balance) : 'Unknown';
        setKeyCreationResult(
          `🎉 SUCCESS! New LP key created and stored!\n\n` +
            `✅ Key: ${result.viewingKey?.slice(0, 16)}...\n` +
            `✅ Balance: ${balanceFormatted}\n` +
            `✅ TX Hash: ${result.txHash?.slice(0, 16)}...`
        );

        // Refresh the validation after creating new key
        setTimeout(() => refresh(), 1000);
      } else {
        setKeyCreationResult(`❌ Failed to create viewing key: ${result.error}`);
      }
    } catch (error) {
      setKeyCreationResult(
        `❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsCreatingKey(false);
    }
  };

  // Demo function for creating viewing key for any token (using sSCRT as example)
  const createScrtViewingKey = async () => {
    if (!secretjs) {
      setScrtKeyResult('Error: Wallet not connected');
      return;
    }

    setIsCreatingScrtKey(true);
    setScrtKeyResult(null);

    try {
      const result = await forceCreateViewingKey({
        secretjs,
        contractAddress: 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek', // sSCRT token
        codeHash: 'af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e',
        onProgress: (message) => setScrtKeyResult(message),
      });

      if (result.success) {
        const balanceFormatted = result.balance ? formatBalance(result.balance) : 'Unknown';
        setScrtKeyResult(
          `🎉 sSCRT viewing key created successfully!\n\n` +
            `✅ Key: ${result.viewingKey?.slice(0, 16)}...\n` +
            `✅ Balance: ${balanceFormatted} sSCRT\n` +
            `✅ TX Hash: ${result.txHash?.slice(0, 16)}...`
        );
      } else {
        setScrtKeyResult(`❌ Failed to create sSCRT viewing key: ${result.error}`);
      }
    } catch (error) {
      setScrtKeyResult(
        `❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsCreatingScrtKey(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold mb-4">VK Debug - sSCRT/USDC.nbl</h1>

        <div className="mb-6 space-y-3">
          <div className="flex gap-3">
            <button onClick={refresh} className="px-3 py-1 bg-blue-600 rounded text-sm">
              Refresh
            </button>
            <button
              onClick={() => void createNewLpViewingKey()}
              disabled={isCreatingKey}
              className="px-3 py-1 bg-green-600 disabled:bg-gray-600 rounded text-sm"
            >
              {isCreatingKey ? 'Creating...' : 'Force Create LP Key'}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => void createScrtViewingKey()}
              disabled={isCreatingScrtKey}
              className="px-3 py-1 bg-purple-600 disabled:bg-gray-600 rounded text-sm"
            >
              {isCreatingScrtKey ? 'Creating...' : 'Force Create sSCRT Key (Demo)'}
            </button>
          </div>
        </div>

        {/* Key Creation Results */}
        {keyCreationResult && (
          <div className="mb-4 p-3 bg-gray-800 border-l-4 border-green-500 rounded">
            <h3 className="font-semibold mb-1 text-green-400">LP Token Key Creation</h3>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">{keyCreationResult}</pre>
          </div>
        )}

        {scrtKeyResult && (
          <div className="mb-4 p-3 bg-gray-800 border-l-4 border-purple-500 rounded">
            <h3 className="font-semibold mb-1 text-purple-400">sSCRT Key Creation (Demo)</h3>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">{scrtKeyResult}</pre>
          </div>
        )}

        {/* LP Token */}
        <div className="mb-4 p-3 bg-gray-900 rounded">
          <h2 className="font-semibold mb-2">LP Token</h2>
          <div className="text-sm space-y-1">
            <div>
              Has Key:{' '}
              <span className={lp.hasKey ? 'text-green-400' : 'text-red-400'}>
                {lp.hasKey ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              Valid:{' '}
              <span className={lp.isValid ? 'text-green-400' : 'text-red-400'}>
                {lp.isValid ? 'Yes' : 'No'}
              </span>
            </div>
            <div>Balance: {formatBalance(lp.balance)}</div>
            {lp.error && <div className="text-red-400">Error: {lp.error}</div>}
          </div>
        </div>

        {/* Staking Contract */}
        <div className="mb-4 p-3 bg-gray-900 rounded">
          <h2 className="font-semibold mb-2">Staking Contract</h2>
          <div className="text-sm space-y-1">
            <div>
              Has Key:{' '}
              <span className={staking.hasKey ? 'text-green-400' : 'text-red-400'}>
                {staking.hasKey ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              Valid:{' '}
              <span className={staking.isValid ? 'text-green-400' : 'text-red-400'}>
                {staking.isValid ? 'Yes' : 'No'}
              </span>
            </div>
            <div>Balance: {formatBalance(staking.balance)}</div>
            {staking.error && <div className="text-red-400">Error: {staking.error}</div>}
          </div>
        </div>

        {/* Key Info */}
        <div className="p-3 bg-gray-900 rounded">
          <h2 className="font-semibold mb-2">Key Status</h2>
          <div className="text-sm">
            <div>Shared Key: {sharedKey ? `${sharedKey.slice(0, 16)}...` : 'None'}</div>
            <div>Should Show Sync: {lp.isValid && !staking.isValid ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {/* Raw Debug Data */}
        <div className="mt-4 p-3 bg-gray-900 rounded">
          <h2 className="font-semibold mb-2">Raw Data</h2>
          <pre className="text-xs text-gray-300 overflow-auto max-h-40">
            {JSON.stringify({ lp, staking, sharedKey }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default VKDebugPage;
