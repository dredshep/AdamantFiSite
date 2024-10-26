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
  const [pools, setPools] = useState<TablePool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getTablePools().then((data) => {
      console.log({ data });
      setPools(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-screen">
          Loading...
        </div>
      </AppLayout>
    );
  }

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
          ]}
        />
        <div className="rounded-b-[10px] overflow-hidden">
          {Array.isArray(pools) ? (
            pools.map((pool, index) => (
              <Link
                key={index}
                className="flex items-center bg-adamant-box-dark hover:brightness-125 select-none py-4 px-6"
                href={`/app/pool/${pool.contract_address}`}
              >
                <FinancialDataRow
                  cells={[
                    {
                      content: (
                        <TokenDisplay
                          seed={pool.contract_address as SecretString}
                          name={pool.name}
                          network={pool.network}
                        />
                      ),
                      minWidth: "240px",
                    },
                    // { content: pool.price, bold: true },
                    // {
                    //   content: pool.change,
                    //   modifier: pool.change.startsWith("-")
                    //     ? "negative"
                    //     : "positive",
                    // },
                    // { content: pool.total_value_locked },
                  ]}
                />
              </Link>
            ))
          ) : (
            <div className="text-center mt-8">
              <p>No pools found.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
