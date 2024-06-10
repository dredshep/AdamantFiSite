import { useRouter } from "next/router";
import AppLayout from "@/components/app/Global/AppLayout";
import React, { useEffect, useState } from "react";
import { TablePool } from "@/types";
import { getTablePools } from "@/utils/apis/getTablePools";
import { CaretRightIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { Breadcrumb } from "@/components/app/Breadcrumb";

export default function PoolPage() {
  const router = useRouter();
  const { pool } = router.query;

  // const details = poolDetails[pool as keyof typeof poolDetails];

  const [pools, setPools] = useState<TablePool[]>([]);
  useEffect(() => {
    getTablePools().then(setPools);
  }, []);

  const details = pools.find((p) => p.userAddress === pool);

  if (!details) {
    return (
      <AppLayout>
        <div className="flex flex-col gap-2 w-full items-center pt-10">
          <div className="text-lg font-semibold">Pool not found</div>
          {/* backlink to return */}
          <Link
            href="/app/pools"
            className="text-black bg-white p-4 py-2 rounded-xl text-xl font-bold"
          >
            Back to Pools
          </Link>
        </div>
      </AppLayout>
    ); // TODO: Not Found page
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto mt-12">
        <Breadcrumb
          linkPath="/app/pools"
          linkText="Pools"
          currentText={details.name}
        />

        {/* Statistics Box */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Statistics</h2>
          <table className="w-full">
            <tbody>
              <tr>
                <td>Total Volume Locked</td>
                <td>{details.tvl}</td>
              </tr>
              <tr>
                <td>Market Cap</td>
                <td>{details.marketCap}</td>
              </tr>
              <tr>
                <td>FDV</td>
                <td>{details.fdv}</td>
              </tr>
              <tr>
                <td>Daily Volume</td>
                <td>{details.dailyVolume}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* My Transactions Box (Placeholder) */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">My Transactions</h2>
          {/* Implement the table or fetch transaction data */}
        </div>

        {/* Swap Form Placeholder */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Swap</h2>
          {/* Your Swap Form Component */}
        </div>

        {/* About Text */}
        <div>
          <h2 className="text-xl font-bold mb-4">About {details.name}</h2>
          <div>{details.about}</div>
        </div>
      </div>
    </AppLayout>
  );
}
