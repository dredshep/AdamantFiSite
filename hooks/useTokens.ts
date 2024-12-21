import { ApiToken, getApiToken } from '@/utils/apis/getSwappableTokens';
import { useEffect, useState } from 'react';

export function useTokens() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        const apiTokens = await getApiToken();

        // Filter out any invalid tokens and ensure they have the correct format
        const validTokens = apiTokens.filter((token) => {
          if (token.address === undefined) return false;
          if (!token.display_props?.symbol) return false;
          if (token.decimals === undefined) return false;

          return token.address.startsWith('secret1');
        });

        setTokens(validTokens);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setError(error instanceof Error ? error : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    void fetchTokens();
  }, []);

  return { tokens, loading, error };
}
