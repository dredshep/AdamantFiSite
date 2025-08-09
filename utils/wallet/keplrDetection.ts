import { Keplr } from '@keplr-wallet/types';

/**
 * Modern Keplr detection that waits for document ready state
 * Based on official Keplr documentation: https://docs.keplr.app/api/getting-started/connect-to-keplr
 */
export async function getKeplr(): Promise<Keplr | undefined> {
  // If Keplr is already available, return it immediately
  if (window.keplr) {
    return window.keplr;
  }

  // If document is already complete, check one more time
  if (document.readyState === 'complete') {
    return window.keplr;
  }

  // Wait for document to be ready and check again
  return new Promise<Keplr | undefined>((resolve) => {
    const documentStateChange = (event: Event) => {
      if (event.target && (event.target as Document).readyState === 'complete') {
        resolve(window.keplr);
        document.removeEventListener('readystatechange', documentStateChange);
      }
    };

    document.addEventListener('readystatechange', documentStateChange);
  });
}

/**
 * Check if Keplr is available with a timeout
 */
export async function waitForKeplr(timeoutMs: number = 10000): Promise<Keplr | null> {
  // First try the standard detection
  const keplr = await getKeplr();
  if (keplr) {
    return keplr;
  }

  // If not found, wait with polling as fallback
  return new Promise<Keplr | null>((resolve) => {
    let attempts = 0;
    const maxAttempts = timeoutMs / 500; // Check every 500ms

    const checkInterval = setInterval(() => {
      attempts++;

      if (window.keplr) {
        clearInterval(checkInterval);
        resolve(window.keplr);
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        resolve(null);
      }
    }, 500);
  });
}

/**
 * Simple synchronous check - use only when you're sure the page is loaded
 */
export function isKeplrAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.keplr;
}
