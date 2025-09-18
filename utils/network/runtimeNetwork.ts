import { getSecretNetworkEnvVars } from '@/utils/env';

export type Endpoint = {
  id: string;
  label: string;
  chainId: string;
  lcdUrl: string;
  rpcUrl: string;
  userProvided?: boolean;
};

type ProbeResult = {
  lcdOk: boolean;
  rpcOk: boolean;
};

const STORAGE_KEYS = {
  endpoints: 'adamant.network.endpoints',
  activeId: 'adamant.network.activeEndpointId',
} as const;

const subscribers = new Set<() => void>();

function emitChange(): void {
  subscribers.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('Network config subscriber failed', e);
    }
  });
}

function normalizeUrl(url: string): string {
  // Ensure no trailing spaces and single trailing slash for base URLs where appropriate
  const trimmed = url.trim();
  if (trimmed.length === 0) return trimmed;
  // Keep as-is; do not force trailing slash, endpoints may include paths
  return trimmed;
}

function generateId(label: string, lcdUrl: string, rpcUrl: string): string {
  // Simple deterministic id based on values to avoid duplicates
  const base = `${label}|${lcdUrl}|${rpcUrl}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    // Basic 32-bit hash
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + base.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash |= 0;
  }
  return `ep_${Math.abs(hash).toString(36)}`;
}

function readLocalStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to write localStorage', e);
  }
}

function curatedDefaults(): Endpoint[] {
  const env = getSecretNetworkEnvVars();
  const chainId = env.CHAIN_ID;

  const envDefault: Endpoint = {
    id: generateId('Environment default', env.LCD_URL, env.RPC_URL),
    label: 'Environment default',
    chainId,
    lcdUrl: normalizeUrl(env.LCD_URL),
    rpcUrl: normalizeUrl(env.RPC_URL),
  };

  const keplr: Endpoint = {
    id: generateId('Keplr', 'https://lcd-secret.keplr.app/', 'https://rpc-secret.keplr.app/'),
    label: 'Keplr',
    chainId,
    lcdUrl: 'https://lcd-secret.keplr.app/',
    rpcUrl: 'https://rpc-secret.keplr.app/',
  };

  const marionodeArchive: Endpoint = {
    id: generateId(
      'Marionode Archive',
      'https://lcd.archive.scrt.marionode.com',
      'https://rpc.archive.scrt.marionode.com/'
    ),
    label: 'Marionode Archive',
    chainId,
    lcdUrl: 'https://lcd.archive.scrt.marionode.com',
    rpcUrl: 'https://rpc.archive.scrt.marionode.com/',
  };

  const starshell: Endpoint = {
    id: generateId(
      'Starshell RPC + Keplr LCD',
      'https://lcd-secret.keplr.app/',
      'https://rpc.secret.adrius.starshell.net/'
    ),
    label: 'Starshell RPC + Keplr LCD',
    chainId,
    lcdUrl: 'https://lcd-secret.keplr.app/',
    rpcUrl: 'https://rpc.secret.adrius.starshell.net/',
  };

  const publicRpc: Endpoint = {
    id: generateId(
      'Public RPC + Keplr LCD',
      'https://lcd-secret.keplr.app/',
      'https://scrt.public-rpc.com'
    ),
    label: 'Public RPC + Keplr LCD',
    chainId,
    lcdUrl: 'https://lcd-secret.keplr.app/',
    rpcUrl: 'https://scrt.public-rpc.com',
  };

  const ankr: Endpoint = {
    id: generateId(
      'Ankr RPC + Keplr LCD',
      'https://lcd-secret.keplr.app/',
      'https://rpc.ankr.com/http/scrt_cosmos'
    ),
    label: 'Ankr RPC + Keplr LCD',
    chainId,
    lcdUrl: 'https://lcd-secret.keplr.app/',
    rpcUrl: 'https://rpc.ankr.com/http/scrt_cosmos',
  };

  // Keep env default first; others as curated options
  return [envDefault, keplr, marionodeArchive, starshell, publicRpc, ankr];
}

function ensureInitialized(): { endpoints: Endpoint[]; activeId: string } {
  const defaults = curatedDefaults();
  const storedEndpoints = readLocalStorage<Endpoint[]>(STORAGE_KEYS.endpoints);
  const storedActive = readLocalStorage<string>(STORAGE_KEYS.activeId);

  let endpoints = storedEndpoints ?? [];
  if (endpoints.length === 0) {
    endpoints = defaults;
    writeLocalStorage(STORAGE_KEYS.endpoints, endpoints);
  } else {
    // Merge defaults by id (avoid duplicates); prefer stored entries
    const present = new Set(endpoints.map((e) => e.id));
    const toAdd = defaults.filter((e) => !present.has(e.id));
    if (toAdd.length > 0) {
      endpoints = [...endpoints, ...toAdd];
      writeLocalStorage(STORAGE_KEYS.endpoints, endpoints);
    }
  }

  let activeId = storedActive ?? '';
  if (!activeId) {
    // Prefer the env default as initial active
    activeId = defaults[0]?.id ?? endpoints[0]?.id ?? '';
    if (activeId) {
      writeLocalStorage(STORAGE_KEYS.activeId, activeId);
    }
  }

  // Validate activeId still exists
  if (!endpoints.some((e) => e.id === activeId)) {
    activeId = endpoints[0]?.id ?? '';
    if (activeId) {
      writeLocalStorage(STORAGE_KEYS.activeId, activeId);
    }
  }

  return { endpoints, activeId };
}

export function listEndpoints(): Endpoint[] {
  return ensureInitialized().endpoints;
}

export function getRuntimeNetworkConfig(): Endpoint {
  const { endpoints, activeId } = ensureInitialized();
  const found = endpoints.find((e) => e.id === activeId);

  if (found) {
    return found;
  }

  // Fallback to first endpoint or create a minimal one
  if (endpoints.length > 0 && endpoints[0]) {
    return endpoints[0];
  }

  // Create a fallback endpoint using env vars if no endpoints exist
  const env = getSecretNetworkEnvVars();
  return {
    id: 'fallback',
    label: 'Fallback',
    chainId: env.CHAIN_ID,
    lcdUrl: env.LCD_URL,
    rpcUrl: env.RPC_URL,
  };
}

export function setActiveEndpoint(id: string): void {
  const { endpoints } = ensureInitialized();
  const exists = endpoints.some((e) => e.id === id);
  if (!exists) return;
  writeLocalStorage(STORAGE_KEYS.activeId, id);
  emitChange();
}

export function addCustomEndpoint(input: {
  label: string;
  lcdUrl: string;
  rpcUrl: string;
}): string {
  const env = getSecretNetworkEnvVars();
  const normalizedLcd = normalizeUrl(input.lcdUrl);
  const normalizedRpc = normalizeUrl(input.rpcUrl);
  const id = generateId(input.label, normalizedLcd, normalizedRpc);

  const current = ensureInitialized();
  const existingIndex = current.endpoints.findIndex((e) => e.id === id);

  const endpoint: Endpoint = {
    id,
    label: input.label,
    chainId: env.CHAIN_ID,
    lcdUrl: normalizedLcd,
    rpcUrl: normalizedRpc,
    userProvided: true,
  };

  let updated: Endpoint[];
  if (existingIndex >= 0) {
    updated = [...current.endpoints];
    updated[existingIndex] = endpoint;
  } else {
    updated = [...current.endpoints, endpoint];
  }

  writeLocalStorage(STORAGE_KEYS.endpoints, updated);
  // Optionally set as active
  writeLocalStorage(STORAGE_KEYS.activeId, id);
  emitChange();
  return id;
}

export function removeCustomEndpoint(id: string): void {
  const current = ensureInitialized();
  const remaining = current.endpoints.filter((e) => !(e.id === id && e.userProvided === true));
  writeLocalStorage(STORAGE_KEYS.endpoints, remaining);
  const activeId = readLocalStorage<string>(STORAGE_KEYS.activeId);
  if (activeId === id) {
    const nextActive = remaining[0]?.id ?? '';
    if (nextActive) writeLocalStorage(STORAGE_KEYS.activeId, nextActive);
  }
  emitChange();
}

export function onNetworkConfigChange(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      });
  });
}

export async function probeEndpoint(endpoint: Endpoint): Promise<ProbeResult> {
  if (typeof window === 'undefined') {
    // On server, skip probing
    return { lcdOk: true, rpcOk: true };
  }

  const lcdBase = endpoint.lcdUrl.replace(/\/$/, '');
  const rpcBase = endpoint.rpcUrl.replace(/\/$/, '');

  const lcdUrl = `${lcdBase}/cosmos/base/tendermint/v1beta1/node_info`;
  const rpcUrl = `${rpcBase}/status`;

  const controllerLcd = new AbortController();
  const controllerRpc = new AbortController();

  const lcdPromise = fetch(lcdUrl, { method: 'GET', signal: controllerLcd.signal }).then(
    (r) => r.ok
  );
  const rpcPromise = fetch(rpcUrl, { method: 'GET', signal: controllerRpc.signal }).then(
    (r) => r.ok
  );

  let lcdOk = false;
  let rpcOk = false;

  try {
    lcdOk = await withTimeout(lcdPromise, 4000);
  } catch {
    lcdOk = false;
    controllerLcd.abort();
  }

  try {
    rpcOk = await withTimeout(rpcPromise, 4000);
  } catch {
    rpcOk = false;
    controllerRpc.abort();
  }

  return { lcdOk, rpcOk };
}

export function buildKeplrChainInfo(
  chainId: string,
  lcdUrl: string,
  rpcUrl: string
): {
  chainId: string;
  chainName: string;
  rpc: string;
  rest: string;
  bip44: { coinType: number };
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
  gasPriceStep: { low: number; average: number; high: number };
  features: string[];
} {
  const name =
    chainId === 'secret-4'
      ? 'Secret Network'
      : chainId === 'pulsar-3'
      ? 'Secret Network Testnet'
      : `Secret Network (${chainId})`;
  return {
    chainId,
    chainName: name,
    rpc: rpcUrl,
    rest: lcdUrl,
    bip44: { coinType: 529 },
    bech32Config: {
      bech32PrefixAccAddr: 'secret',
      bech32PrefixAccPub: 'secretpub',
      bech32PrefixValAddr: 'secretvaloper',
      bech32PrefixValPub: 'secretvaloperpub',
      bech32PrefixConsAddr: 'secretvalcons',
      bech32PrefixConsPub: 'secretvalconspub',
    },
    currencies: [
      { coinDenom: 'SCRT', coinMinimalDenom: 'uscrt', coinDecimals: 6, coinGeckoId: 'secret' },
    ],
    feeCurrencies: [
      { coinDenom: 'SCRT', coinMinimalDenom: 'uscrt', coinDecimals: 6, coinGeckoId: 'secret' },
    ],
    stakeCurrency: {
      coinDenom: 'SCRT',
      coinMinimalDenom: 'uscrt',
      coinDecimals: 6,
      coinGeckoId: 'secret',
    },
    gasPriceStep: { low: 0.25, average: 0.5, high: 1 },
    features: ['secretwasm'],
  };
}
