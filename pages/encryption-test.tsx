import { useEncryptionTest } from '@/hooks/useEncryptionTest';

export default function EncryptionTestPage() {
  const {
    isRunning,
    keplrResult,
    encryptionUtilsResult,
    keyComparison,
    runTest,
    reset,
    hasResults,
  } = useEncryptionTest();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Encryption Test Arena</h1>

        <div className="mb-8">
          <p className="text-gray-300 mb-4">
            This test compares Keplr's enigmaUtils vs secretjs EncryptionUtilsImpl to isolate the
            decryption issue.
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => void runTest()}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
            >
              {isRunning ? '⏳ Running Test...' : '🚀 Run Test'}
            </button>

            {hasResults && (
              <button
                onClick={reset}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold"
              >
                🔄 Reset
              </button>
            )}
          </div>
        </div>

        {/* Test Configuration */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Test Token:</span>
              <div className="font-mono">secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek</div>
            </div>
            <div>
              <span className="text-gray-400">Code Hash:</span>
              <div className="font-mono text-xs">
                af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e
              </div>
            </div>
          </div>
        </div>

        {/* Key Comparison */}
        {keyComparison && (
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">🔑 Encryption Key Comparison</h2>
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg ${
                  keyComparison.areIdentical ? 'bg-green-900/50' : 'bg-red-900/50'
                }`}
              >
                <div className="font-semibold mb-2">
                  Keys are {keyComparison.areIdentical ? 'IDENTICAL ✅' : 'DIFFERENT ❌'}
                </div>
                {!keyComparison.areIdentical && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-red-400">Keplr Key:</span>
                      <div className="font-mono text-xs break-all">{keyComparison.keplrPubKey}</div>
                    </div>
                    <div>
                      <span className="text-green-400">Utils Key:</span>
                      <div className="font-mono text-xs break-all">{keyComparison.utilsPubKey}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {(keplrResult || encryptionUtilsResult) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Keplr Results */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                🔴 Keplr enigmaUtils
                {keplrResult && (
                  <span
                    className={`text-sm px-2 py-1 rounded ${
                      keplrResult.success ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    {keplrResult.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                )}
              </h2>

              {keplrResult ? (
                <div className="space-y-3">
                  {keplrResult.success ? (
                    <div>
                      <div className="text-green-400 font-semibold">✅ Balance query succeeded</div>
                      {keplrResult.result ? (
                        <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto mt-2">
                          {JSON.stringify(keplrResult.result, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ) : (
                    <div>
                      <div className="text-red-400 font-semibold">❌ Balance query failed</div>
                      <div className="bg-red-900/50 p-3 rounded mt-2 text-sm">
                        {keplrResult.error}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400">Not tested yet</div>
              )}
            </div>

            {/* EncryptionUtilsImpl Results */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                🟢 EncryptionUtilsImpl
                {encryptionUtilsResult && (
                  <span
                    className={`text-sm px-2 py-1 rounded ${
                      encryptionUtilsResult.success ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    {encryptionUtilsResult.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                )}
              </h2>

              {encryptionUtilsResult ? (
                <div className="space-y-3">
                  {encryptionUtilsResult.success ? (
                    <div>
                      <div className="text-green-400 font-semibold">✅ Balance query succeeded</div>
                      {encryptionUtilsResult.result ? (
                        <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto mt-2">
                          {JSON.stringify(encryptionUtilsResult.result, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ) : (
                    <div>
                      <div className="text-red-400 font-semibold">❌ Balance query failed</div>
                      <div className="bg-red-900/50 p-3 rounded mt-2 text-sm">
                        {encryptionUtilsResult.error}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400">Not tested yet</div>
              )}
            </div>
          </div>
        )}

        {/* Analysis */}
        {keplrResult && encryptionUtilsResult && (
          <div className="bg-gray-800 p-6 rounded-lg mt-8">
            <h2 className="text-xl font-semibold mb-4">📊 Analysis</h2>
            <div className="space-y-3">
              {!keplrResult.success && !encryptionUtilsResult.success && (
                <div className="p-4 bg-yellow-900/50 rounded-lg">
                  <div className="font-semibold text-yellow-400">🔥 Both approaches failed</div>
                  <div className="text-sm mt-2">
                    This suggests the issue is not with the encryption method but possibly:
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>Network connectivity issues</li>
                      <li>Contract or code hash problems</li>
                      <li>Viewing key issues</li>
                      <li>LCD endpoint problems</li>
                    </ul>
                  </div>
                </div>
              )}

              {!keplrResult.success && encryptionUtilsResult.success && (
                <div className="p-4 bg-green-900/50 rounded-lg">
                  <div className="font-semibold text-green-400">✅ Fix confirmed!</div>
                  <div className="text-sm mt-2">
                    EncryptionUtilsImpl works while Keplr enigmaUtils fails. This confirms the
                    hardcoded network key issue in Keplr has been resolved by using
                    EncryptionUtilsImpl.
                  </div>
                </div>
              )}

              {keplrResult.success && !encryptionUtilsResult.success && (
                <div className="p-4 bg-red-900/50 rounded-lg">
                  <div className="font-semibold text-red-400">⚠️ Unexpected result</div>
                  <div className="text-sm mt-2">
                    Keplr works but EncryptionUtilsImpl fails. This suggests our EncryptionUtilsImpl
                    setup might be incorrect.
                  </div>
                </div>
              )}

              {keplrResult.success && encryptionUtilsResult.success && (
                <div className="p-4 bg-blue-900/50 rounded-lg">
                  <div className="font-semibold text-blue-400">🤔 Both work</div>
                  <div className="text-sm mt-2">
                    Both approaches work. The issue might be elsewhere in the application, or the
                    network key issue may have been resolved on Keplr's side.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
