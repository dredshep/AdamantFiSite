import { getSecretNetworkEnvVars } from '@/utils/env';
import { useCallback, useState } from 'react';
import { EncryptionUtilsImpl, SecretNetworkClient } from 'secretjs';

const TEST_TOKEN_ADDRESS = 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek'; // sSCRT
const TEST_TOKEN_CODE_HASH = 'af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e';

interface TestResult {
  success: boolean;
  error?: string;
  result?: unknown;
  pubKey?: string;
}

interface EncryptionTestState {
  isRunning: boolean;
  keplrResult: TestResult | null;
  encryptionUtilsResult: TestResult | null;
  centralizedClientResult: TestResult | null;
  keyComparison: {
    keplrPubKey?: string;
    utilsPubKey?: string;
    centralizedPubKey?: string;
    areIdentical?: boolean;
  } | null;
}

export function useEncryptionTest() {
  const [state, setState] = useState<EncryptionTestState>({
    isRunning: false,
    keplrResult: null,
    encryptionUtilsResult: null,
    centralizedClientResult: null,
    keyComparison: null,
  });

  const waitForKeplr = useCallback((): Promise<typeof window.keplr> => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.keplr) {
        return resolve(window.keplr);
      }

      setTimeout(() => {
        if (typeof window !== 'undefined' && window.keplr) {
          resolve(window.keplr);
        } else {
          reject(new Error('Keplr not found after waiting'));
        }
      }, 2000);
    });
  }, []);

  const testKeplrEnigmaUtils = useCallback(async (): Promise<TestResult> => {
    try {
      const keplr = await waitForKeplr();
      if (!keplr) {
        throw new Error('Keplr not found');
      }
      const env = getSecretNetworkEnvVars();

      await keplr.enable(env.CHAIN_ID);

      const offlineSigner = keplr.getOfflineSignerOnlyAmino(env.CHAIN_ID);
      const enigmaUtils = keplr.getEnigmaUtils(env.CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();

      if (!accounts[0]) {
        throw new Error('No accounts found');
      }

      const client = new SecretNetworkClient({
        chainId: env.CHAIN_ID,
        url: env.LCD_URL,
        wallet: offlineSigner,
        walletAddress: accounts[0].address,
        encryptionUtils: enigmaUtils,
      });

      // Get viewing key
      const viewingKey = await keplr.getSecret20ViewingKey(env.CHAIN_ID, TEST_TOKEN_ADDRESS);
      if (!viewingKey) {
        throw new Error('No viewing key found for test token');
      }

      // Get public key for comparison
      const pubKey = await enigmaUtils.getPubkey();
      console.log('Keplr enigmaUtils pubkey:', Buffer.from(pubKey).toString('hex'));

      const result = await client.query.compute.queryContract({
        contract_address: TEST_TOKEN_ADDRESS,
        code_hash: TEST_TOKEN_CODE_HASH,
        query: {
          balance: {
            address: accounts[0].address,
            key: viewingKey,
          },
        },
      });

      return {
        success: true,
        result,
        pubKey: Buffer.from(pubKey).toString('hex'),
      };
    } catch (error) {
      console.error('Keplr enigmaUtils test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error, null, 2),
      };
    }
  }, [waitForKeplr]);

  const testEncryptionUtilsImpl = useCallback(async (): Promise<TestResult> => {
    try {
      const keplr = await waitForKeplr();
      if (!keplr) {
        throw new Error('Keplr not found');
      }
      const env = getSecretNetworkEnvVars();

      console.log('Keplr version:', keplr.version || 'unknown');
      console.log('Network environment:', {
        chainId: env.CHAIN_ID,
        lcdUrl: env.LCD_URL,
        rpcUrl: env.RPC_URL,
      });

      await keplr.enable(env.CHAIN_ID);

      const offlineSigner = keplr.getOfflineSignerOnlyAmino(env.CHAIN_ID);

      // Use LCD URL like our main app does
      console.log('Testing EncryptionUtilsImpl with LCD URL (same as main app)...');
      const encryptionUtils = new EncryptionUtilsImpl(env.LCD_URL, undefined, env.CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();

      if (!accounts[0]) {
        throw new Error('No accounts found');
      }

      const client = new SecretNetworkClient({
        chainId: env.CHAIN_ID,
        url: env.LCD_URL,
        wallet: offlineSigner,
        walletAddress: accounts[0].address,
        encryptionUtils: encryptionUtils,
      });

      // Get viewing key (still need Keplr for this)
      const viewingKey = await keplr.getSecret20ViewingKey(env.CHAIN_ID, TEST_TOKEN_ADDRESS);
      if (!viewingKey) {
        throw new Error('No viewing key found for test token');
      }

      // Get public key for comparison
      const pubKey = await encryptionUtils.getPubkey();
      console.log('EncryptionUtilsImpl pubkey:', Buffer.from(pubKey).toString('hex'));

      // Test balance query
      const result = await client.query.compute.queryContract({
        contract_address: TEST_TOKEN_ADDRESS,
        code_hash: TEST_TOKEN_CODE_HASH,
        query: {
          balance: {
            address: accounts[0].address,
            key: viewingKey,
          },
        },
      });

      return {
        success: true,
        result,
        pubKey: Buffer.from(pubKey).toString('hex'),
      };
    } catch (error) {
      console.error('EncryptionUtilsImpl test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error, null, 2),
      };
    }
  }, [waitForKeplr]);

  const runTest = useCallback(async () => {
    setState((prev) => ({ ...prev, isRunning: true }));

    console.log('Starting encryption test...');

    try {
      // Run both tests
      console.log('Testing Keplr enigmaUtils...');
      const keplrResult = await testKeplrEnigmaUtils();

      console.log('Testing EncryptionUtilsImpl...');
      const encryptionUtilsResult = await testEncryptionUtilsImpl();

      // Compare keys if both have them
      const keyComparison =
        keplrResult.pubKey && encryptionUtilsResult.pubKey
          ? {
              keplrPubKey: keplrResult.pubKey,
              utilsPubKey: encryptionUtilsResult.pubKey,
              areIdentical: keplrResult.pubKey === encryptionUtilsResult.pubKey,
            }
          : null;

      setState({
        isRunning: false,
        keplrResult,
        encryptionUtilsResult,
        centralizedClientResult: null,
        keyComparison,
      });

      // Log results
      console.log('Keplr enigmaUtils:', keplrResult.success ? 'SUCCESS' : 'FAILED');
      if (!keplrResult.success) console.log('   Error:', keplrResult.error);

      console.log('EncryptionUtilsImpl:', encryptionUtilsResult.success ? 'SUCCESS' : 'FAILED');
      if (!encryptionUtilsResult.success) console.log('   Error:', encryptionUtilsResult.error);

      if (keyComparison) {
        console.log('Keys identical:', keyComparison.areIdentical ? 'YES' : 'NO');
        if (!keyComparison.areIdentical) {
          console.log('   Keplr key:', keyComparison.keplrPubKey);
          console.log('   Utils key:', keyComparison.utilsPubKey);
        }
      }
    } catch (error) {
      console.error('Test failed:', error);
      setState((prev) => ({
        ...prev,
        isRunning: false,
        keplrResult: { success: false, error: 'Test setup failed' },
        encryptionUtilsResult: { success: false, error: 'Test setup failed' },
      }));
    }
  }, [testKeplrEnigmaUtils, testEncryptionUtilsImpl]);

  const reset = useCallback(() => {
    setState({
      isRunning: false,
      keplrResult: null,
      encryptionUtilsResult: null,
      centralizedClientResult: null,
      keyComparison: null,
    });
  }, []);

  return {
    ...state,
    runTest,
    reset,
    hasResults: state.keplrResult !== null || state.encryptionUtilsResult !== null,
  };
}
