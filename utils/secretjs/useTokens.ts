import { useEffect, useState } from "react";
import { getTableTokens } from "@/utils/apis/getTableTokens";
import { TableToken } from "@/types";

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
      if (!window.keplr) {
        alert("Keplr extension not installed");
        return;
      }
      await window.keplr.enable(chainId);
    }

    void enableKeplr();
  }, [chainId]);

  return tokens;
}
