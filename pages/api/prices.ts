import { TOKENS } from '@/config/tokens';
import { isPricingEnabled } from '@/utils/features';
import { NextApiRequest, NextApiResponse } from 'next';

// Rate limiting - simple in-memory store (use Redis in production)
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP

// Server-side cache to prevent duplicate external API calls
interface CachedPriceData {
  data: Record<
    string,
    {
      usd: number;
      usd_24h_change?: number;
      symbol: string;
    }
  >;
  timestamp: number;
  etag?: string;
}

const priceCache = new Map<string, CachedPriceData>();
const CACHE_DURATION = 300000; // 5 minutes

// Create allowed CoinGecko IDs from our token config
const ALLOWED_COINGECKO_IDS = TOKENS.filter((token) => token.coingeckoId).reduce((acc, token) => {
  if (token.coingeckoId) {
    acc[token.coingeckoId] = token.symbol;
  }
  return acc;
}, {} as Record<string, string>);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimit.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset window
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limited
  }

  userLimit.count++;
  return true;
}

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(',')[0]
    : req.socket.remoteAddress;
  return ip || 'unknown';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if pricing feature is enabled
  if (!isPricingEnabled()) {
    return res.status(503).json({
      error: 'Pricing disabled',
      message: 'Pricing features are disabled on this instance.',
    });
  }

  // Rate limiting
  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  }

  try {
    const { ids } = req.query;

    // If no IDs specified, return all our tokens
    let requestedIds: string[];
    if (!ids) {
      requestedIds = Object.keys(ALLOWED_COINGECKO_IDS);
    } else {
      // Validate requested IDs against our whitelist
      const idsArray = typeof ids === 'string' ? ids.split(',') : [ids].flat();
      requestedIds = idsArray.filter(
        (id) => typeof id === 'string' && id.trim() !== '' && ALLOWED_COINGECKO_IDS[id.trim()]
      );

      if (requestedIds.length === 0) {
        return res.status(400).json({
          error: 'Invalid token IDs',
          message: 'Only our supported tokens are allowed',
          allowedIds: Object.keys(ALLOWED_COINGECKO_IDS),
        });
      }
    }

    // Create cache key based on requested IDs
    const cacheKey = requestedIds.sort().join(',');
    const cachedData = priceCache.get(cacheKey);

    // Check if we have valid cached data
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      // Set cache headers for cached response
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      res.setHeader('X-Cache', 'HIT');

      // Filter cached data to only include requested tokens
      const filteredData: Record<string, { usd: number; usd_24h_change?: number; symbol: string }> =
        {};
      requestedIds.forEach((id) => {
        if (cachedData.data[id]) {
          filteredData[id] = cachedData.data[id];
        }
      });

      return res.status(200).json(filteredData);
    }

    // Build CoinGecko URL - use full coins/markets endpoint instead of simple/price
    const baseUrl = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
    const apiKey = process.env.COINGECKO_API_KEY;
    const authHeader = process.env.COINGECKO_AUTH_HEADER || 'x-cg-demo-api-key';

    if (!apiKey) {
      throw new Error('CoinGecko API key is required but not configured');
    }

    const idsParam = requestedIds.join(',');
    const url = `${baseUrl}/coins/markets?ids=${encodeURIComponent(
      idsParam
    )}&vs_currency=usd&include_24hr_change=true&include_market_cap=false&include_volume=false&sparkline=false`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'AdamantFi-App/1.0',
      [authHeader]: apiKey,
    };

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    // The coins/markets endpoint returns an array, not an object
    const data = (await response.json()) as Array<{
      id: string;
      current_price: number;
      price_change_percentage_24h?: number;
    }>;

    // Transform array to object format matching our expected interface
    const pricesWithSymbols = data.reduce(
      (acc, coinData) => {
        const tokenSymbol = ALLOWED_COINGECKO_IDS[coinData.id];
        if (tokenSymbol) {
          acc[coinData.id] = {
            usd: coinData.current_price,
            usd_24h_change: coinData.price_change_percentage_24h ?? 0,
            symbol: tokenSymbol,
          };
        }
        return acc;
      },
      {} as Record<
        string,
        {
          usd: number;
          usd_24h_change?: number;
          symbol: string;
        }
      >
    );

    // Cache the response for future requests
    priceCache.set(cacheKey, {
      data: pricesWithSymbols,
      timestamp: Date.now(),
    });

    // Set cache headers (5 minutes)
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.setHeader('X-Cache', 'MISS');

    res.status(200).json(pricesWithSymbols);
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    res.status(500).json({
      error: 'Failed to fetch prices',
      message: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error',
    });
  }
}
