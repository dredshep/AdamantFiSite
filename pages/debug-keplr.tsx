import { useEffect, useState } from 'react';

export default function DebugKeplr() {
  const [diagnostics, setDiagnostics] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDiagnostics(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDiagnostic = () => {
    setDiagnostics([]);
    addLog('=== Keplr Diagnostic Start ===');
    
    // Check basic window object
    addLog(`1. Window object exists: ${typeof window !== 'undefined'}`);
    
    // Check if window.keplr exists
    addLog(`2. window.keplr exists: ${!!(window as any).keplr}`);
    addLog(`3. window.keplr value: ${(window as any).keplr}`);
    
    // Check all window properties that might be related to wallets
    const walletKeys = Object.keys(window).filter(key => 
      key.toLowerCase().includes('keplr') || 
      key.toLowerCase().includes('wallet') ||
      key.toLowerCase().includes('cosmos')
    );
    addLog(`4. Wallet-related window properties: ${JSON.stringify(walletKeys)}`);
    
    // Check extension presence in different ways
    addLog(`5. Extensions in window: ${JSON.stringify(Object.keys(window).filter(key => key.includes('extension')))}`);
    
    // Check document ready state
    addLog(`6. Document ready state: ${document.readyState}`);
    
    // Check for any injected providers
    const ethereum = (window as any).ethereum;
    addLog(`7. window.ethereum exists: ${!!ethereum}`);
    
    // Check if this might be running in an extension context
    addLog(`8. Chrome extension context: ${!!(window as any).chrome?.extension}`);
    
    // Check user agent
    addLog(`9. User agent: ${navigator.userAgent}`);
    
    // Check for alternative injection points
    addLog(`10. window.keplr type: ${typeof (window as any).keplr}`);
    addLog(`11. window.getOfflineSigner: ${typeof (window as any).getOfflineSigner}`);
    addLog(`12. All window props starting with 'k': ${Object.keys(window).filter(k => k.toLowerCase().startsWith('k')).join(', ')}`);
    
    // Try to detect Keplr in different ways with delays
    setTimeout(() => {
      addLog(`13. After 1s - window.keplr: ${!!(window as any).keplr}`);
    }, 1000);
    
    setTimeout(() => {
      addLog(`14. After 3s - window.keplr: ${!!(window as any).keplr}`);
    }, 3000);
    
    setTimeout(() => {
      addLog(`15. After 5s - window.keplr: ${!!(window as any).keplr}`);
    }, 5000);
    
    addLog('=== Keplr Diagnostic End ===');
  };

  const checkExtensionStatus = () => {
    addLog('=== Extension Status Check ===');
    
    // Check if we're on HTTPS
    addLog(`Protocol: ${window.location.protocol}`);
    addLog(`Host: ${window.location.host}`);
    
    // Check if any extension APIs are available
    addLog(`Chrome runtime: ${!!(window as any).chrome?.runtime}`);
    addLog(`Chrome extension: ${!!(window as any).chrome?.extension}`);
    
    // Check for content script injection
    const scripts = Array.from(document.scripts);
    const extensionScripts = scripts.filter(script => 
      script.src.includes('extension://') || script.src.includes('moz-extension://')
    );
    addLog(`Extension scripts found: ${extensionScripts.length}`);
    
    addLog('=== Extension Status End ===');
  };

  useEffect(() => {
    // Auto-run diagnostic on page load
    setTimeout(runDiagnostic, 500);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Keplr Debug Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={runDiagnostic} style={{ marginRight: '10px' }}>
          Run Keplr Diagnostic
        </button>
        <button onClick={checkExtensionStatus} style={{ marginRight: '10px' }}>
          Check Extension Status
        </button>
        <button onClick={() => setDiagnostics([])}>
          Clear Logs
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '5px',
        maxHeight: '600px',
        overflow: 'auto'
      }}>
        <h3>Diagnostic Output:</h3>
        {diagnostics.length === 0 ? (
          <p>Click "Run Keplr Diagnostic" to start...</p>
        ) : (
          diagnostics.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px', fontSize: '12px' }}>
              {log}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Manual Tests (Open Browser Console):</h3>
        <code style={{ display: 'block', backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '10px' }}>
          console.log('window.keplr:', window.keplr);
        </code>
        <code style={{ display: 'block', backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '10px' }}>
          console.log('Keplr keys:', Object.keys(window).filter(k => k.includes('keplr')));
        </code>
        <code style={{ display: 'block', backgroundColor: '#f0f0f0', padding: '10px' }}>
          setTimeout(() => console.log('Delayed check:', !!window.keplr), 5000);
        </code>
      </div>
    </div>
  );
}

