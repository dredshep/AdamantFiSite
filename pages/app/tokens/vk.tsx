import TokenDisplay from "@/components/app/Shared/Tables/TokenDisplay";
import AppLayout from "@/components/app/Global/AppLayout";
import { SecretString, TableToken } from "@/types";
import Link from "next/link";
import {
  TableHeaders,
  FinancialDataRow,
  FinancialTableSearchBar,
} from "@/components/app/Shared/Tables/FinancialTable";
import { useEffect, useState } from "react";
import { getTableTokens } from "@/utils/apis/getTableTokens";

export default function TokensPage() {
  const [tokens, setTokens] = useState<TableToken[]>([]);
  const [viewingKeys, setViewingKeys] = useState<{ [address: string]: string }>(
    {}
  );
  const chainId = "secret-4"; // Use the correct chain ID for your network

  useEffect(() => {
    async function main() {
      const tableTokens = await getTableTokens();
      console.log({ tableTokens });
      setTokens(tableTokens);

      // Load viewing keys from local storage
      const storedKeys = JSON.parse(
        localStorage.getItem("viewingKeys") || "{}"
      );
      setViewingKeys(storedKeys);

      if (!(window as unknown as { keplr: any }).keplr) {
        alert("Keplr extension not installed");
        return;
      }
      // Ensure Keplr is enabled for the page
      await (window as unknown as { keplr: any }).keplr.enable(chainId);
    }
    main();
  }, []);

  const handleSyncViewingKey = async (tokenAddress: string) => {
    try {
      if (!(window as unknown as { keplr: any }).keplr) {
        alert("Keplr extension not installed");
        return;
      }
      const viewingKey = await (
        window as unknown as { keplr: any }
      ).keplr.getSecret20ViewingKey(chainId, tokenAddress);
      console.log("Retrieved Viewing Key:", viewingKey);
      const updatedKeys = { ...viewingKeys, [tokenAddress]: viewingKey };
      setViewingKeys(updatedKeys);
      localStorage.setItem("viewingKeys", JSON.stringify(updatedKeys));
    } catch (error) {
      console.error("Error fetching viewing key:", error);
      alert(
        "Failed to fetch the viewing key. Make sure the token is registered in Keplr."
      );
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto mt-12">
        <div className="flex justify-between mb-8">
          <FinancialTableSearchBar
            placeholder="Search token or paste address"
            onSearch={(value) => console.log(value)}
          />
        </div>
        <TableHeaders
          headers={[
            { title: "Token", minWidth: "240px" },
            { title: "Price" },
            { title: "Change" },
            { title: "TVL" },
            { title: "Volume" },
            { title: "Graph" },
            { title: "Actions" },
          ]}
        />
        <div className="rounded-b-[10px] overflow-hidden">
          {tokens?.map((token, index) => (
            <div
              key={index}
              className="flex items-center bg-adamant-box-dark hover:brightness-125 select-none py-4 px-6"
            >
              <Link href={`/app/token/${token.address}`} className="flex-grow">
                <FinancialDataRow
                  cells={[
                    {
                      content: (
                        <TokenDisplay
                          seed={token.address as SecretString}
                          name={token.name}
                          network={token.network}
                        />
                      ),
                      minWidth: "240px",
                    },
                    { content: token.price, bold: true },
                    {
                      content: token.change,
                      modifier: token.change.startsWith("-")
                        ? "negative"
                        : "positive",
                    },
                    { content: token.tvl },
                    { content: token.volume },
                    { content: "Graph Placeholder" }, // This would be replaced with an actual graph component or representation
                  ]}
                />
              </Link>
              <button
                onClick={() => handleSyncViewingKey(token.address)}
                className="ml-auto bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Sync Key
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
