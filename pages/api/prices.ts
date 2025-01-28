import { NextApiRequest, NextApiResponse } from 'next';

const COINGECKO_IDS = {
  SCRT: 'secret',
  SEFI: 'secret-finance',
  ETH: 'ethereum',
  ATOM: 'cosmos',
  USDC: 'usd-coin',
};

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const ids = Object.values(COINGECKO_IDS).join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
    );
    const data = (await response.json()) as Record<string, Record<string, number>>;

    // Transform to our format
    const prices = Object.entries(COINGECKO_IDS).reduce((acc, [symbol, geckoId]) => {
      acc[symbol] = data[geckoId]?.['usd'] ?? 0;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json(prices);
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
}
