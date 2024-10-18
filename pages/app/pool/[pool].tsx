import { useRouter } from "next/router";
import AppLayout from "@/components/app/Global/AppLayout";
import React, { useEffect, useState } from "react";
import { SecretString, TablePool } from "@/types";
import { getTablePools } from "@/utils/apis/getTablePools";
import { queryPool } from "@/utils/apis/getPairPool";
import Link from "next/link";
import { Breadcrumb } from "@/components/app/Breadcrumb";
import SwapForm from "@/components/app/Pages/Swap/SwapForm/SwapForm";
import DepositForm from "@/components/app/Pages/Pool/DepositForm";

interface PairPoolData {
  assets: {
    info: {
      token: {
        contract_addr: string;
        token_code_hash: string;
        viewing_key: string;
      };
    };
    amount: string;
  }[];
  total_share: string;
}

export default function PoolPage() {
  const router = useRouter();
  const { pool } = router.query;

  const [pools, setPools] = useState<TablePool[]>([]);
  const [pairPoolData, setPairPoolData] = useState<PairPoolData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [poolsData, pairData] = await Promise.all([
          getTablePools(),
          pool && typeof pool === "string" ? queryPool(pool) : null,
        ]);
        setPools(poolsData);
        if (pairData) {
          setPairPoolData(pairData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pool]);

  const details = pools.find((p) => p.contract_address === pool);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-screen">
          Loading...
        </div>
      </AppLayout>
    );
  }

  if (!details || !pairPoolData) {
    return (
      <AppLayout>
        <div className="flex flex-col gap-2 w-full items-center pt-10">
          <div className="text-lg font-semibold">Pool not found</div>
          <Link
            href="/app/pools"
            className="text-black bg-white p-4 py-2 rounded-xl text-xl font-bold"
          >
            Back to Pools
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Extract token information for the DepositForm
  const [token1, token2] = pairPoolData.assets.map((asset) => ({
    symbol: asset.info.token.contract_addr.slice(-5), // This is a placeholder, you should use actual token symbols
    balance: parseFloat(asset.amount), // This is the pool balance, not the user's balance
    address: asset.info.token.contract_addr as SecretString,
  }));

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto mt-12 flex flex-col gap-4">
        <Breadcrumb
          linkPath="/app/pools"
          linkText="Pools"
          currentText={details.name}
        />
        <div className="grid grid-cols-2 gap-4">
          {/* Chart */}
          <div className="bg-adamant-app-box p-4 rounded-xl">
            <h2 className="text-xl font-bold mb-4">Chart</h2>
            {/* Implement chart component */}
          </div>

          {/* Statistics Box */}
          <div className="bg-adamant-app-box p-4 rounded-xl">
            <h2 className="text-xl font-bold mb-4">Statistics</h2>
            <table className="w-full">
              <tbody>
                <tr>
                  <td>Total Share</td>
                  <td>{pairPoolData.total_share}</td>
                </tr>
                {pairPoolData.assets.map((asset, index) => (
                  <tr key={index}>
                    <td>Asset {index + 1}</td>
                    <td>{asset.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* My Positions */}
          <div className="bg-adamant-app-box p-4 rounded-xl">
            <h2 className="text-xl font-bold mb-4">My Positions</h2>
            {/* Implement positions component */}
          </div>

          {/* Unclaimed Rewards */}
          <div className="bg-adamant-app-box p-4 rounded-xl">
            <h2 className="text-xl font-bold mb-4">Unclaimed Rewards</h2>
            {/* Implement unclaimed rewards component */}
          </div>
        </div>
        <div className="flex gap-4">
          {/* Swap Form */}
          <div className="mt-4 bg-adamant-app-box p-4 rounded-xl flex-1">
            <h2 className="text-xl font-bold mb-4">Swap</h2>
            <SwapForm />
          </div>

          {/* Deposit Form */}
          <div className="mt-4 bg-adamant-app-box p-4 rounded-xl flex-1 flex flex-col">
            <h2 className="text-xl font-bold mb-4">Deposit</h2>
            <DepositForm token1={token1} token2={token2} />
          </div>
        </div>

        {/* About Text */}
        <div className="mt-4 bg-adamant-app-box p-4 rounded-xl">
          <h2 className="text-xl font-bold mb-4">About {details.name}</h2>
          <div>{details.about}</div>
        </div>
      </div>
    </AppLayout>
  );
}
