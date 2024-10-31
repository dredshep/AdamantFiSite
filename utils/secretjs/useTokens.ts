import { useEffect, useState } from "react";
import { getTableTokens } from "@/utils/apis/getTableTokens";
import { TableToken } from "@/types";
import isNotNullish from "../isNotNullish";
import { Window } from "@keplr-wallet/types";

export function useTokens(chainId: string) {
  const [tokens, setTokens] = useState<TableToken[]>([]);

  useEffect(() => {
    async function fetchTokens() {
      try {
        const tokensData = await getTableTokens();
        setTokens(tokensData);
      } catch (error) {
        console.error("Failed to fetch tokens:", error);
      }
    }

    void fetchTokens();
  }, []);

  useEffect(() => {
    async function enableKeplr() {
      const keplr = (window as unknown as Window).keplr;
      if (!isNotNullish(keplr)) {
        alert("Keplr extension not installed");
        return;
      }
      await keplr.enable(chainId);
    }

    void enableKeplr();
  }, [chainId]);

  return tokens;
}
