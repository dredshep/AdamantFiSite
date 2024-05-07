import { Token } from "@/types";
import getUrl from "@/utils/apis/getUrl";

// Utils to fetch swappable tokens
export const getSwappableTokens = async () => {
  const response = await fetch(getUrl("/api/getSwappableTokens"));
  const data: Token[] = await response.json();
  return data;
};
