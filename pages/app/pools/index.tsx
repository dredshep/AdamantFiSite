import TokenDisplay from "@/components/app/Shared/Tables/TokenDisplay";
import AppLayout from "@/components/app/Global/AppLayout";
import { SecretString, TablePool } from "@/types";
import Link from "next/link";
import {
  TableHeaders,
  FinancialDataRow,
  FinancialTableSearchBar,
} from "@/components/app/Shared/Tables/FinancialTable";
import { useEffect, useState } from "react";
import { getTablePools } from "@/utils/apis/getTablePools";

export default function PoolsPage() {
  const [tokens, setTokens] = useState<TablePool[]>([]);

  useEffect(() => {
    (() => getTablePools().then(setTokens))();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto mt-12">
        <div className="flex justify-center mb-8">
          <FinancialTableSearchBar
            placeholder="Search pool or paste address"
            onSearch={(value) => console.log(value)}
          />
        </div>
        <TableHeaders
          headers={[
            { title: "Pool", minWidth: "240px" },
            { title: "Price" },
            { title: "Change" },
            { title: "TVL" },
            { title: "Volume" },
            { title: "Graph" },
          ]}
        />
        {tokens.map((pool, index) => (
          <Link
            key={index}
            className="flex items-center bg-adamant-box-dark hover:brightness-125 select-none py-4 px-6"
            href={`/app/pool/${pool.userAddress}`}
          >
            <FinancialDataRow
              cells={[
                {
                  content: (
                    <TokenDisplay
                      seed={pool.userAddress as SecretString}
                      name={pool.name}
                      network={pool.network}
                    />
                  ),
                  minWidth: "240px",
                },
                { content: pool.price, bold: true },
                {
                  content: pool.change,
                  modifier: pool.change.startsWith("-")
                    ? "negative"
                    : "positive",
                },
                { content: pool.tvl },
                { content: pool.volume },
                { content: "Graph Placeholder" },
              ]}
            />
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
