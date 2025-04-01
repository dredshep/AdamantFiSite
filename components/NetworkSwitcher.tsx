import { getSecretNetworkEnvVars } from '@/utils/env';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

interface ChainInfo {
  chainId: string;
  chainName: string;
  rpc: string;
  rest: string;
  bip44: {
    coinType: number;
  };
  bech32Config: {
    bech32PrefixAccAddr: string;
    bech32PrefixAccPub: string;
    bech32PrefixValAddr: string;
    bech32PrefixValPub: string;
    bech32PrefixConsAddr: string;
    bech32PrefixConsPub: string;
  };
  currencies: Array<{
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
    coinGeckoId: string;
  }>;
  feeCurrencies: Array<{
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
    coinGeckoId: string;
  }>;
  stakeCurrency: {
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
    coinGeckoId: string;
  };
  gasPriceStep: {
    low: number;
    average: number;
    high: number;
  };
  features: string[];
}

export default function NetworkSwitcher() {
  const [isResuggesting, setIsResuggesting] = useState(false);
  const [chainDetails, setChainDetails] = useState<{
    chainId: string;
    lcdUrl: string;
    rpcUrl: string;
  } | null>(null);

  // Get the environment variables
  useEffect(() => {
    try {
      const env = getSecretNetworkEnvVars();
      setChainDetails({
        chainId: env.CHAIN_ID,
        lcdUrl: env.LCD_URL,
        rpcUrl: env.RPC_URL,
      });
    } catch (error) {
      console.error('Failed to get Secret Network env vars:', error);
    }
  }, []);

  // Function to re-suggest the chain to Keplr
  const resuggestChain = async () => {
    if (!chainDetails) {
      toast.error('Chain details not available. Please check your environment variables.');
      return;
    }

    if (!window.keplr) {
      toast.error('Keplr extension not found. Please install Keplr first.');
      return;
    }

    setIsResuggesting(true);

    try {
      // Create the chain info object with our environment variables
      const chainInfo: ChainInfo = {
        chainId: chainDetails.chainId,
        chainName:
          chainDetails.chainId === 'secret-4'
            ? 'Secret Network'
            : chainDetails.chainId === 'pulsar-3'
            ? 'Secret Network Testnet'
            : `Secret Network (${chainDetails.chainId})`,
        rpc: chainDetails.rpcUrl,
        rest: chainDetails.lcdUrl,
        bip44: {
          coinType: 529,
        },
        bech32Config: {
          bech32PrefixAccAddr: 'secret',
          bech32PrefixAccPub: 'secretpub',
          bech32PrefixValAddr: 'secretvaloper',
          bech32PrefixValPub: 'secretvaloperpub',
          bech32PrefixConsAddr: 'secretvalcons',
          bech32PrefixConsPub: 'secretvalconspub',
        },
        currencies: [
          {
            coinDenom: 'SCRT',
            coinMinimalDenom: 'uscrt',
            coinDecimals: 6,
            coinGeckoId: 'secret',
          },
        ],
        feeCurrencies: [
          {
            coinDenom: 'SCRT',
            coinMinimalDenom: 'uscrt',
            coinDecimals: 6,
            coinGeckoId: 'secret',
          },
        ],
        stakeCurrency: {
          coinDenom: 'SCRT',
          coinMinimalDenom: 'uscrt',
          coinDecimals: 6,
          coinGeckoId: 'secret',
        },
        gasPriceStep: {
          low: 0.25,
          average: 0.5,
          high: 1,
        },
        features: ['secretwasm'],
      };

      // Log the chain info for debugging
      console.log('Suggesting chain info to Keplr:', chainInfo);

      // Suggest the chain to Keplr
      await window.keplr.experimentalSuggestChain(chainInfo);

      // Re-enable the chain to apply the changes
      await window.keplr.enable(chainDetails.chainId);

      // Disconnect and reconnect to refresh the connection
      try {
        await window.keplr.disable(chainDetails.chainId);
        console.log('Disabled Keplr connection');

        // Wait a moment before re-enabling
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await window.keplr.enable(chainDetails.chainId);
        console.log('Re-enabled Keplr connection');

        // Try to register the incentives token with code hash
        try {
          const env = getSecretNetworkEnvVars();
          if (env.INCENTIVES_CONTRACT_ADDRESS && env.INCENTIVES_CONTRACT_HASH) {
            console.log(
              `Re-suggesting token ${env.INCENTIVES_CONTRACT_ADDRESS} with code hash: ${env.INCENTIVES_CONTRACT_HASH}`
            );
            await window.keplr.suggestToken(
              chainDetails.chainId,
              env.INCENTIVES_CONTRACT_ADDRESS,
              env.INCENTIVES_CONTRACT_HASH
            );
          }
        } catch (tokenError) {
          console.error('Error suggesting token with code hash:', tokenError);
        }

        toast.success(`Network connection refreshed with LCD URL: ${chainDetails.lcdUrl}`, {
          autoClose: 5000,
        });
      } catch (error) {
        console.error('Error reconnecting to Keplr:', error);
      }
    } catch (error) {
      console.error('Failed to suggest chain to Keplr:', error);
      toast.error('Failed to configure network in Keplr. Please try again.');
    } finally {
      setIsResuggesting(false);
    }
  };

  if (!chainDetails) {
    return null;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-orange-700">
      <h2 className="text-xl font-semibold mb-2 text-white">Network Configuration</h2>
      <div className="text-sm mb-4">
        <div className="flex flex-col space-y-1">
          <p>
            <span className="text-gray-400">Chain ID:</span>{' '}
            <span className="text-blue-400">{chainDetails.chainId}</span>
          </p>
          <p>
            <span className="text-gray-400">LCD URL:</span>{' '}
            <span className="text-blue-400">{chainDetails.lcdUrl}</span>
          </p>
          <p>
            <span className="text-gray-400">RPC URL:</span>{' '}
            <span className="text-blue-400">{chainDetails.rpcUrl}</span>
          </p>
        </div>
      </div>

      <div className="mb-2 text-sm text-amber-300">
        <p>
          If you're experiencing API connection issues, try refreshing the network configuration in
          Keplr.
        </p>
      </div>

      <button
        onClick={() => void resuggestChain()}
        disabled={isResuggesting}
        className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:bg-gray-700 disabled:text-gray-500"
      >
        {isResuggesting ? 'Refreshing Network...' : 'Refresh Network Configuration'}
      </button>
    </div>
  );
}
