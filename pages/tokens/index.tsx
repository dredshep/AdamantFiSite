import TokenDisplay from "@/components/app/Shared/Tables/TokenDisplay";
import AppLayout from "@/components/app/Global/AppLayout";
import { TableToken } from "@/types";
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

  useEffect(() => {
    async function main() {
      const tableTokens = await getTableTokens();
      console.log({ tableTokens });
      setTokens(tableTokens);
    }
    void main();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto mt-12">
        <div className="flex justify-center mb-8">
          <FinancialTableSearchBar
            placeholder="Search token or paste address"
            onSearch={(value) => console.log(value)}
          />
        </div>
        <TableHeaders
          headers={[
            { title: "Token", minWidth: "240px" },
            // { title: "Price" },
            { title: "Change" },
            { title: "TVL" },
            { title: "Volume" },
            { title: "Graph" },
          ]}
        />
        <div className="rounded-b-[10px] overflow-hidden">
          {tokens?.map((token, index) => (
            <Link
              key={index}
              className="flex items-center bg-adamant-box-dark hover:brightness-125 select-none py-4 px-6"
              href={`/app/token/${token.address}`}
            >
              <FinancialDataRow
                cells={[
                  {
                    content: (
                      <TokenDisplay
                        seed={token.address}
                        name={token.name}
                        // network={token.network}
                      />
                    ),
                    minWidth: "240px",
                  },
                  // { content: token.price, bold: true },
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
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
