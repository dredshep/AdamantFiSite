import { TOKENS } from '@/config/tokens';
import React, { useState } from 'react';
import DualViewingKeyCreator from './DualViewingKeyCreator';
import QuickKeyActions from './QuickKeyActions';

/**
 * Quick test button to add to existing pages for testing
 * Add this to any page where you want to test the dual setup
 */
const QuickTestButton: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showQuick, setShowQuick] = useState(false);

  // Use sSCRT as default test token, fallback to first available token
  const testToken = TOKENS.find((t) => t.symbol === 'sSCRT') || TOKENS[0];

  // Don't render if no tokens available
  if (!testToken) {
    return null;
  }

  const handleSuccess = (viewingKey: string) => {
    console.log('✅ Test Success:', viewingKey);
    alert(`✅ Success! Created viewing key: ${viewingKey.slice(0, 8)}...${viewingKey.slice(-8)}`);
  };

  const handleError = (error: Error) => {
    console.error('❌ Test Error:', error);
    alert(`❌ Error: ${error.message}`);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {/* Test Buttons */}
      <div className="bg-adamant-box-dark border border-adamant-box-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-adamant-text-box-secondary mb-2">🧪 Test Dual Setup:</p>

        <div className="space-y-2">
          <button
            onClick={() => setShowModal(true)}
            className="w-full text-xs bg-adamant-gradientBright hover:bg-adamant-gradientDark text-white px-3 py-2 rounded transition-colors"
          >
            Test Full Modal
          </button>

          <button
            onClick={() => setShowQuick(!showQuick)}
            className="w-full text-xs bg-adamant-box-regular hover:bg-adamant-box-border text-adamant-text-box-main border border-adamant-box-border px-3 py-2 rounded transition-colors"
          >
            {showQuick ? 'Hide' : 'Show'} Quick Actions
          </button>
        </div>

        {/* Quick Actions Test Area */}
        {showQuick && (
          <div className="mt-3 pt-3 border-t border-adamant-box-border">
            <p className="text-xs text-adamant-text-box-secondary mb-2">Quick Actions:</p>
            <QuickKeyActions
              token={testToken}
              onSuccess={handleSuccess}
              onError={handleError}
              compact={true}
            />
          </div>
        )}
      </div>

      {/* Full Modal */}
      <DualViewingKeyCreator
        token={testToken}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
        onError={handleError}
        title="🧪 Test Dual Setup"
        description="Testing the dual viewing key creation system. Try both auto-generation and custom key input!"
      />
    </div>
  );
};

export default QuickTestButton;
