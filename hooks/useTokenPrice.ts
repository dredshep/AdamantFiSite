import { useState, useEffect } from "react";
import { usePriceStore } from "@/store/priceStore";

const fetchTokenPrice = async (tokenAddress: string): Promise<number> => {
  const response = await fetch(
    `/api/getCoingeckoPrice?address=${tokenAddress}`
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = (await response.json()) as { price: number };
  return data.price;
};

export const useTokenPrice = (tokenAddress: string) => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { getPrice, setPrice: setPriceInStore } = usePriceStore();

  useEffect(() => {
    const fetchPrice = async () => {
      setLoading(true);
      setError(null);

      try {
        const storedPrice = getPrice(tokenAddress);
        if (storedPrice !== null) {
          setPrice(storedPrice);
        } else {
          const fetchedPrice = await fetchTokenPrice(tokenAddress);
          setPriceInStore(tokenAddress, fetchedPrice);
          setPrice(fetchedPrice);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    void fetchPrice();
  }, [tokenAddress, getPrice, setPriceInStore]);

  return { price, loading, error };
};
