import { TOKENS } from '@/config/tokens';
import React, { useState } from 'react';
import DualViewingKeyCreator from './DualViewingKeyCreator';
import QuickKeyActions from './QuickKeyActions';
import ViewingKeyMiniCreator from './ViewingKeyMiniCreator';

/**
 * Example component demonstrating the dual viewing key setup options
 * Shows how auto-generation and custom key can be integrated
 */
const DualSetupExample: React.FC = () => {
  const [showFullModal, setShowFullModal] = useState(false);
  const [showMiniCreator, setShowMiniCreator] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  // Use sSCRT as example token
  const exampleToken = TOKENS.find((t) => t.symbol === 'sSCRT') || TOKENS[0];

  const addResult = (message: string) => {
    setResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleSuccess = (viewingKey: string) => {
    addResult(
      `✅ Successfully created viewing key: ${viewingKey.slice(0, 8)}...${viewingKey.slice(-8)}`
    );
  };

  const handleError = (error: Error) => {
    addResult(`❌ Error: ${error.message}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-adamant-text-box-main mb-2">
          Dual Viewing Key Setup Options
        </h1>
        <p className="text-adamant-text-box-secondary">
          Choose between secure auto-generation or bring your own key
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Option 1: Full Dual Modal */}
        <div className="bg-adamant-box-dark border border-adamant-box-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-adamant-text-box-main mb-3">
            1. Full Dual Setup Modal
          </h2>
          <p className="text-sm text-adamant-text-box-secondary mb-4">
            Complete interface with tabs for auto-generation and custom key input. Best for
            first-time setup or when users need guidance.
          </p>

          <div className="space-y-3">
            <div className="bg-adamant-box-regular p-3 rounded text-xs">
              <strong className="text-adamant-gradientBright">Features:</strong>
              <ul className="mt-1 space-y-1 text-adamant-text-box-secondary">
                <li>• Tabbed interface (Auto vs Custom)</li>
                <li>• Key preview and validation</li>
                <li>• Educational content</li>
                <li>• Password visibility toggles</li>
              </ul>
            </div>

            <button
              onClick={() => setShowFullModal(true)}
              className="w-full bg-adamant-gradientBright hover:bg-adamant-gradientDark text-white py-2 px-4 rounded transition-colors"
            >
              Open Full Dual Modal
            </button>
          </div>

          <DualViewingKeyCreator
            token={exampleToken}
            isOpen={showFullModal}
            onClose={() => setShowFullModal(false)}
            onSuccess={handleSuccess}
            onError={handleError}
            title="Dual Setup Example"
            description="Choose between auto-generation for maximum security or provide your own custom key for consistency across dApps."
          />
        </div>

        {/* Option 2: Enhanced Mini Creator */}
        <div className="bg-adamant-box-dark border border-adamant-box-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-adamant-text-box-main mb-3">
            2. Enhanced Mini Creator
          </h2>
          <p className="text-sm text-adamant-text-box-secondary mb-4">
            Compact version with collapsible advanced options. Perfect for inline error handling and
            quick actions.
          </p>

          <div className="space-y-3">
            <div className="bg-adamant-box-regular p-3 rounded text-xs">
              <strong className="text-adamant-gradientBright">Features:</strong>
              <ul className="mt-1 space-y-1 text-adamant-text-box-secondary">
                <li>• Default auto-generation</li>
                <li>• Collapsible custom key option</li>
                <li>• Smaller footprint</li>
                <li>• Quick toggle between modes</li>
              </ul>
            </div>

            <button
              onClick={() => setShowMiniCreator(true)}
              className="w-full bg-adamant-gradientBright hover:bg-adamant-gradientDark text-white py-2 px-4 rounded transition-colors"
            >
              Open Enhanced Mini Creator
            </button>
          </div>

          <ViewingKeyMiniCreator
            token={exampleToken}
            isOpen={showMiniCreator}
            onClose={() => setShowMiniCreator(false)}
            onSuccess={() => handleSuccess('(created via mini creator)')}
            onError={handleError}
          />
        </div>

        {/* Option 3: Quick Actions (Full) */}
        <div className="bg-adamant-box-dark border border-adamant-box-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-adamant-text-box-main mb-3">
            3. Quick Actions (Full)
          </h2>
          <p className="text-sm text-adamant-text-box-secondary mb-4">
            Embedded dual actions for integration into existing UIs. No modal required - works
            inline.
          </p>

          <div className="space-y-3">
            <div className="bg-adamant-box-regular p-3 rounded text-xs">
              <strong className="text-adamant-gradientBright">Best for:</strong>
              <ul className="mt-1 space-y-1 text-adamant-text-box-secondary">
                <li>• Error recovery flows</li>
                <li>• Toast action buttons</li>
                <li>• Settings pages</li>
                <li>• Debug interfaces</li>
              </ul>
            </div>

            <QuickKeyActions
              token={exampleToken}
              onSuccess={handleSuccess}
              onError={handleError}
              compact={false}
            />
          </div>
        </div>

        {/* Option 4: Quick Actions (Compact) */}
        <div className="bg-adamant-box-dark border border-adamant-box-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-adamant-text-box-main mb-3">
            4. Quick Actions (Compact)
          </h2>
          <p className="text-sm text-adamant-text-box-secondary mb-4">
            Ultra-compact version for tight spaces like toast notifications or inline error
            messages.
          </p>

          <div className="space-y-3">
            <div className="bg-adamant-box-regular p-3 rounded text-xs">
              <strong className="text-adamant-gradientBright">Perfect for:</strong>
              <ul className="mt-1 space-y-1 text-adamant-text-box-secondary">
                <li>• Toast action areas</li>
                <li>• Inline error states</li>
                <li>• Table row actions</li>
                <li>• Minimal space constraints</li>
              </ul>
            </div>

            <div className="bg-adamant-box-regular p-3 rounded">
              <p className="text-xs text-adamant-text-box-secondary mb-2">
                Example in toast context:
              </p>
              <QuickKeyActions
                token={exampleToken}
                onSuccess={handleSuccess}
                onError={handleError}
                compact={true}
                className="justify-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Integration Examples */}
      <div className="bg-adamant-box-dark border border-adamant-box-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-adamant-text-box-main mb-4">
          Integration Examples
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-adamant-text-box-main mb-2">Error Toast Integration</h3>
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded text-sm">
              <p className="text-red-400 mb-2">❌ sSCRT viewing key failed: Invalid key format</p>
              <p className="text-adamant-text-box-secondary text-xs mb-3">
                You can quickly fix this by creating a new viewing key automatically, or use your
                own custom key.
              </p>
              <QuickKeyActions
                token={exampleToken}
                onSuccess={handleSuccess}
                onError={handleError}
                compact={true}
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium text-adamant-text-box-main mb-2">BYOK Use Cases</h3>
            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded text-sm">
              <p className="text-blue-400 mb-2">💡 Popular Custom Key Strategies:</p>
              <ul className="text-adamant-text-box-secondary text-xs space-y-1">
                <li>• Same key across all dApps for convenience</li>
                <li>• Memorable personal phrases</li>
                <li>• Keys exported from other wallets</li>
                <li>• Team/organization shared keys</li>
                <li>• Testing with known keys</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Results Log */}
      {results.length > 0 && (
        <div className="bg-adamant-box-dark border border-adamant-box-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-adamant-text-box-main">Action Results</h2>
            <button
              onClick={() => setResults([])}
              className="text-xs text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="bg-adamant-box-regular rounded p-3 max-h-32 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className="text-xs text-adamant-text-box-secondary font-mono mb-1">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Implementation Notes */}
      <div className="bg-adamant-box-dark border border-adamant-box-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-adamant-text-box-main mb-4">
          Implementation Benefits
        </h2>

        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-adamant-gradientBright mb-2">For New Users</h3>
            <ul className="text-adamant-text-box-secondary space-y-1">
              <li>• One-click secure key generation</li>
              <li>• No complex Keplr navigation</li>
              <li>• Immediate problem resolution</li>
              <li>• Guided experience</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-adamant-gradientBright mb-2">For Power Users</h3>
            <ul className="text-adamant-text-box-secondary space-y-1">
              <li>• BYOK (Bring Your Own Key) support</li>
              <li>• Consistent keys across dApps</li>
              <li>• Advanced key management</li>
              <li>• Quick integration options</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-adamant-gradientBright mb-2">For Developers</h3>
            <ul className="text-adamant-text-box-secondary space-y-1">
              <li>• Modular component design</li>
              <li>• Multiple integration levels</li>
              <li>• Consistent error handling</li>
              <li>• Reduced support burden</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualSetupExample;
