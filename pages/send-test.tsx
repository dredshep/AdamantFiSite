import { getSecretNetworkEnvVars } from '@/utils/env';
import { Window } from '@keplr-wallet/types';
import { useState } from 'react';
import { EncryptionUtilsImpl, SecretNetworkClient, TxResultCode } from 'secretjs';

const TEST_RECIPIENT = 'secret16dyfc744j0lrhae0xpfjxl5cnx2hu80h0p0rad';
const TEST_AMOUNT = '10000'; // 0.01 SCRT in uscrt

export default function SendTest() {
  const [keplrResult, setKeplrResult] = useState<string>('');
  const [secretjsResult, setSecretjsResult] = useState<string>('');
  const [isKeplrTesting, setIsKeplrTesting] = useState(false);
  const [isSecretjsTesting, setIsSecretjsTesting] = useState(false);

  const testWithKeplrEnigma = async () => {
    setIsKeplrTesting(true);
    setKeplrResult('Testing...');

    try {
      const keplr = (window as unknown as Window).keplr;
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

      console.log('Keplr client created, sending transaction...');

      const tx = await client.tx.bank.send(
        {
          from_address: accounts[0].address,
          amount: [{ amount: TEST_AMOUNT, denom: 'uscrt' }],
          to_address: TEST_RECIPIENT,
        },
        { gasLimit: 50_000 }
      );

      if (tx.code !== TxResultCode.Success) {
        throw new Error(`Transaction failed: ${tx.rawLog}`);
      }

      setKeplrResult(`SUCCESS: ${tx.transactionHash}`);
    } catch (error) {
      console.error('Keplr test failed:', error);
      setKeplrResult(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsKeplrTesting(false);
    }
  };

  const testWithSecretjsEncryption = async () => {
    setIsSecretjsTesting(true);
    setSecretjsResult('Testing...');

    try {
      const keplr = (window as unknown as Window).keplr;
      if (!keplr) {
        throw new Error('Keplr not found');
      }

      const env = getSecretNetworkEnvVars();
      await keplr.enable(env.CHAIN_ID);

      const offlineSigner = keplr.getOfflineSignerOnlyAmino(env.CHAIN_ID);
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

      console.log('SecretJS client created, sending transaction...');

      const tx = await client.tx.bank.send(
        {
          from_address: accounts[0].address,
          amount: [{ amount: TEST_AMOUNT, denom: 'uscrt' }],
          to_address: TEST_RECIPIENT,
        },
        { gasLimit: 50_000 }
      );

      if (tx.code !== TxResultCode.Success) {
        throw new Error(`Transaction failed: ${tx.rawLog}`);
      }

      setSecretjsResult(`SUCCESS: ${tx.transactionHash}`);
    } catch (error) {
      console.error('SecretJS test failed:', error);
      setSecretjsResult(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSecretjsTesting(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '700px' }}>
      <h1>Send Test - Encryption Utils Comparison</h1>
      <p>Sending 0.01 SCRT to: {TEST_RECIPIENT}</p>

      <div style={{ marginBottom: '30px' }}>
        <h2>1. Keplr EnigmaUtils</h2>
        <button
          onClick={() => void testWithKeplrEnigma()}
          disabled={isKeplrTesting}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: isKeplrTesting ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isKeplrTesting ? 'not-allowed' : 'pointer',
          }}
        >
          {isKeplrTesting ? 'Testing...' : 'Send with Keplr EnigmaUtils'}
        </button>
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            minHeight: '40px',
          }}
        >
          {keplrResult || 'No result yet'}
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>2. SecretJS EncryptionUtilsImpl</h2>
        <button
          onClick={() => void testWithSecretjsEncryption()}
          disabled={isSecretjsTesting}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: isSecretjsTesting ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSecretjsTesting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSecretjsTesting ? 'Testing...' : 'Send with SecretJS EncryptionUtilsImpl'}
        </button>
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            minHeight: '40px',
          }}
        >
          {secretjsResult || 'No result yet'}
        </div>
      </div>
    </div>
  );
}
