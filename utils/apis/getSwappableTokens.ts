import { Token } from "@/types";

export const getSwappableTokens = async (): Promise<Token[]> => {
  const response = await fetch("/api/getSwappableTokens");
  const data: Token[] = await response.json();
  return data;
};
