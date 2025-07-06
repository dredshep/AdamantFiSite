import { LoadBalancePreference } from '@/utils/env';
import { showToastOnce } from '@/utils/toast/toastManager';
import React, { useState } from 'react';
import { RiArrowLeftLine, RiCheckLine, RiKey2Line } from 'react-icons/ri';

interface SettingsPanelProps {
  onClose: () => void;
  onManageKeys: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, onManageKeys }) => {
  const [selectedPreference, setSelectedPreference] = useState<LoadBalancePreference>(
    (process.env['NEXT_PUBLIC_LOAD_BALANCE_PREFERENCE'] as LoadBalancePreference) ||
      LoadBalancePreference.Pair
  );

  const preferences = [
    {
      value: LoadBalancePreference.None,
      title: 'None',
      description: 'Never auto-load balances. Always show fetch buttons.',
      icon: '🚫',
    },
    {
      value: LoadBalancePreference.Pair,
      title: 'Pair',
      description: 'Load balances only for current trading pair. Manual fetch for others.',
      icon: '⚖️',
    },
    {
      value: LoadBalancePreference.All,
      title: 'All',
      description: 'Automatically load all token balances.',
      icon: '🔄',
    },
  ];

  const handleSave = () => {
    // Note: This would typically require a backend to persist the setting
    // For now, we'll just show a toast indicating the preference would be saved
    showToastOnce(
      'settings-saved',
      `Balance loading preference set to: ${selectedPreference}`,
      'success'
    );
    showToastOnce(
      'settings-note',
      'Note: This setting will reset on page refresh. Contact support to persist settings.',
      'info',
      {
        autoClose: 8000,
      }
    );
    onClose();
  };

  return (
    <div className="p-6 flex flex-col h-full">
      {/* Back button */}
      <div className="flex items-center mb-6">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-adamant-text-box-secondary hover:text-white transition-colors"
        >
          <RiArrowLeftLine />
          Back to Wallet
        </button>
      </div>

      <div className="flex-1 space-y-6">
        {/* Balance Loading Preference */}
        <div>
          <h3 className="font-bold text-white text-base mb-3">Balance Auto-Loading</h3>
          <div className="space-y-3">
            {preferences.map((pref) => (
              <div
                key={pref.value}
                onClick={() => setSelectedPreference(pref.value)}
                className={`
                  p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                  ${
                    selectedPreference === pref.value
                      ? 'bg-adamant-box-regular border-adamant-gradientBright/50'
                      : 'bg-adamant-box-dark border-adamant-box-border hover:border-adamant-box-border-highlight'
                  }
                `}
              >
                <div className="flex items-center">
                  <div className="text-2xl mr-4">{pref.icon}</div>
                  <div>
                    <div className="font-semibold text-white">{pref.title}</div>
                    <div className="text-sm text-adamant-text-box-secondary">
                      {pref.description}
                    </div>
                  </div>
                  {selectedPreference === pref.value && (
                    <RiCheckLine className="ml-auto w-6 h-6 text-adamant-gradientBright" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Management */}
        <div>
          <h3 className="font-bold text-white text-base mb-3">Key Management</h3>
          <button
            onClick={onManageKeys}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-adamant-box-dark hover:bg-adamant-box-regular border-2 border-adamant-box-border hover:border-adamant-box-border-highlight transition-all duration-200"
          >
            <div className="flex items-center">
              <RiKey2Line className="w-5 h-5 mr-3 text-adamant-gradientBright" />
              <div>
                <div className="font-semibold text-white">Manage Contract Keys</div>
                <div className="text-sm text-adamant-text-box-secondary">
                  View and copy your saved viewing keys.
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6">
        <button
          onClick={handleSave}
          className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 transition-colors duration-200"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};
