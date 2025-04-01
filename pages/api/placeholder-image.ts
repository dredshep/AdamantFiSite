import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const seed = req.query['seed'] as string;
    const size = (req.query['size'] as string) || '48';
    const shape1Color = req.query['shape1Color'] as string;
    const shape2Color = req.query['shape2Color'] as string;
    const shape3Color = req.query['shape3Color'] as string;

    if (!seed) {
      return res.status(400).json({ error: 'Seed parameter is required' });
    }

    const colorQueryString = `shape1Color=${shape1Color}&shape2Color=${shape2Color}&shape3Color=${shape3Color}`;
    const dicebearUrl = `https://api.dicebear.com/6.x/shapes/svg?seed=${seed}&height=${size}&width=${size}&${colorQueryString}`;

    console.log('Requesting DiceBear URL:', dicebearUrl);

    const response = await fetch(dicebearUrl);
    const responseText = await response.text();

    if (!response.ok) {
      console.error('DiceBear API error details:', {
        status: response.status,
        statusText: response.statusText,
        response: responseText,
      });
      throw new Error(`DiceBear API error: ${response.status} ${response.statusText}`);
    }

    // Set cache headers
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, immutable`);
    res.setHeader('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());

    res.status(200).send(responseText);
  } catch (error) {
    console.error('Error fetching placeholder image:', error);
    res.status(500).json({
      error: 'Failed to fetch placeholder image',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
