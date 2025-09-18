import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { useState } from 'react';

const STAKING_CONTRACT = 'secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev';
const BADMT_TOKEN = 'secret1cu5gvrvu24hm36fzyq46vca7u25llrymj6ntek';
const BADMT_HASH = '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e';

export default function BalanceCheck() {
  const { secretjs, walletAddress } = useKeplrConnection();
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const checkBalance = async () => {
    if (!secretjs || !walletAddress) {
      setResult('Error: Wallet not connected');
      return;
    }

    setLoading(true);
    try {
      // Create permit for the staking contract's bADMT balance
      const permit = await secretjs.utils.accessControl.permit.sign(
        walletAddress,
        'secret-4',
        'balance-check',
        [BADMT_TOKEN],
        ['balance'],
        false
      );

      // Query staking contract's bADMT balance
      const balance = await secretjs.query.snip20.getBalance({
        contract: { address: BADMT_TOKEN, code_hash: BADMT_HASH },
        address: STAKING_CONTRACT,
        auth: { permit },
      });

      const rawBalance = balance.balance?.amount || 'undefined';
      const formattedBalance = parseInt(rawBalance) / 1_000_000; // Convert from base units

      setResult(
        `Staking Contract bADMT Balance: ${formattedBalance.toLocaleString()} bADMT (raw: ${rawBalance})`
      );
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Staking Contract Balance Check</h1>
      <p>Staking Contract: {STAKING_CONTRACT}</p>
      <p>Token: bADMT ({BADMT_TOKEN})</p>
      <p>Wallet: {walletAddress || 'Not connected'}</p>

      <button onClick={checkBalance} disabled={loading || !secretjs}>
        {loading ? 'Checking...' : 'Check Balance'}
      </button>

      {result && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
          {result}
        </div>
      )}
    </div>
  );
}

