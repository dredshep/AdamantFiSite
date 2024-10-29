import { useRouter } from "next/router";
import AppLayout from "@/components/app/Global/AppLayout";
import React from "react";
import { SecretString } from "@/types";
import Link from "next/link";
import { Breadcrumb } from "@/components/app/Breadcrumb";
import SwapForm from "@/components/app/Pages/Swap/SwapForm/SwapForm";
import DepositForm from "@/components/app/Pages/Pool/DepositForm";
import { usePoolForm } from "@/hooks/usePoolForm";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { AlertCircle } from "lucide-react";
import WithdrawForm from "@/components/app/Pages/Pool/WithdrawForm";

type TopBoxesProps = {
  poolAddress: string;
};

function TopBoxes({ poolAddress }: TopBoxesProps) {
  const { pairPoolData } = usePoolForm(poolAddress);
  if (!pairPoolData) return null;
  return (
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
              <td>{pairPoolData?.total_share}</td>
            </tr>
            {pairPoolData?.assets.map((asset, index) => (
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
  );
}

export default function PoolPage() {
  const router = useRouter();
  const { pool } = router.query;
  const { loadingState, poolDetails, pairPoolData } = usePoolForm(pool);

  if (loadingState.status === "loading") {
    return (
      <AppLayout>
        <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
          <LoadingSpinner size={40} />
          <div className="text-lg font-medium text-gray-200">
            {loadingState.message}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loadingState.status === "error") {
    return (
      <AppLayout>
        <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
          <div className="bg-red-500/10 p-6 rounded-xl flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <div className="text-lg font-medium text-red-500">
              {loadingState.message ?? "Something went wrong"}
            </div>
            <Link
              href="/app/pools"
              className="mt-2 bg-white text-black px-6 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Back to Pools
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!poolDetails || !pairPoolData) {
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

  if (typeof token1 === "undefined" || typeof token2 === "undefined") {
    console.error(
      "Expected 2 tokens, got token 1:",
      token1,
      "token 2:",
      token2
    );
    return (
      <AppLayout>
        <div>Error: Invalid token data.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto mt-12 flex flex-col gap-4">
        <Breadcrumb
          linkPath="/app/pools"
          linkText="Pools"
          currentText={poolDetails.name}
        />
        <TopBoxes poolAddress={pool as string} />
        <div className="flex gap-4">
          {/* Swap Form */}
          <div className="mt-4 bg-adamant-app-box p-4 rounded-xl flex-1">
            <h2 className="text-xl font-bold mb-4">Swap</h2>
            <SwapForm />
          </div>

          {/* Deposit Form */}
          <div className="mt-4 bg-adamant-app-box p-4 rounded-xl flex-1 flex flex-col">
            <h2 className="text-xl font-bold mb-4">Deposit</h2>
            <DepositForm />
            <WithdrawForm />
          </div>
        </div>

        {/* About Text */}
        <div className="mt-4 bg-adamant-app-box p-4 rounded-xl">
          <h2 className="text-xl font-bold mb-4">About {poolDetails.name}</h2>
          <div>{poolDetails.about}</div>
        </div>
      </div>
    </AppLayout>
  );
}
