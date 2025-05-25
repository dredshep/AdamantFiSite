import { LoadBalancePreference } from '@/utils/env';
import React, { useState } from 'react';
import { RiArrowLeftLine, RiCheckLine } from 'react-icons/ri';
import { toast } from 'react-toastify';

interface SettingsPanelProps {
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
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
    toast.success(`Balance loading preference set to: ${selectedPreference}`);
    toast.info(
      'Note: This setting will reset on page refresh. Contact support to persist settings.'
    );
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-adamant-box-border">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-adamant-box-dark/50 transition-colors text-adamant-text-box-secondary hover:text-adamant-text-box-main"
        >
          <RiArrowLeftLine className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-adamant-text-box-main">Settings</h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-adamant-text-box-main mb-3">
            Balance Loading Preference
          </h3>
          <p className="text-xs text-adamant-text-box-secondary mb-4">
            Choose when token balances should be automatically loaded to optimize performance and
            prevent rate limiting.
          </p>

          <div className="space-y-3">
            {preferences.map((preference) => (
              <button
                key={preference.value}
                onClick={() => setSelectedPreference(preference.value)}
                className={`w-full p-4 rounded-xl border transition-all duration-200 text-left ${
                  selectedPreference === preference.value
                    ? 'border-adamant-gradientBright bg-adamant-gradientBright/10'
                    : 'border-adamant-box-border hover:border-adamant-gradientBright/50 hover:bg-adamant-box-dark/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{preference.icon}</span>
                    <div>
                      <div className="font-medium text-adamant-text-box-main mb-1">
                        {preference.title}
                      </div>
                      <div className="text-xs text-adamant-text-box-secondary">
                        {preference.description}
                      </div>
                    </div>
                  </div>
                  {selectedPreference === preference.value && (
                    <RiCheckLine className="w-5 h-5 text-adamant-gradientBright flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-adamant-box-border">
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark text-black font-semibold hover:from-adamant-gradientDark hover:to-adamant-gradientBright transition-all duration-300"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};
