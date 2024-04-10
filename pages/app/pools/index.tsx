import TokenDisplay from "@/components/app/atoms/TokenDisplay";
import AppLayout from "@/components/app/compositions/AppLayout";
import PlaceholderImageFromSeed from "@/components/app/molecules/PlaceholderImageFromSeed";
import { SecretString } from "@/types";
import Link from "next/link";

const tokens = [
  {
    userAddress: "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek",
    name: "SCRT",
    network: "Secret Network",
    price: "$0.10",
    change: "-5%",
    tvl: "$100K",
    volume: "$48K",
  },
  {
    userAddress: "secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt",
    name: "ADMT",
    network: "Secret Network",
    price: "$0.20",
    change: "10%",
    tvl: "$200K",
    volume: "$101K",
  },
];

export default function PoolsPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto mt-12">
        <div className="flex justify-center mb-8">
          <input
            type="text"
            placeholder="Search pool or paste address"
            className="w-full px-4 py-2 bg-adamant-box-dark rounded-xl"
          />
        </div>
        {/* Table Header */}
        <div className="flex text-xs text-gray-500 uppercase bg-adamant-app-box dark:bg-gray-700 dark:text-gray-400 py-3 px-6">
          <div className="flex-1 min-w-60">pool</div>
          <div className="flex-1">Price</div>
          <div className="flex-1">Change</div>
          <div className="flex-1">TVL</div>
          <div className="flex-1">Volume</div>
          <div className="flex-1">Graph</div>
        </div>
        {/* Table Rows */}
        {tokens.map((pool, index) => (
          <Link
            key={index}
            className="flex items-center bg-adamant-box-dark hover:brightness-125 select-none py-4 px-6"
            href={`/app/pool/${pool.userAddress}`}
          >
            <TokenDisplay
              seed={pool.userAddress as SecretString}
              name={pool.name}
              network={pool.network}
            />
            <div className="flex-1 text-white font-bold">{pool.price}</div>
            <div
              className={`flex-1 ${
                pool.change.startsWith("-") ? "text-red-500" : "text-green-500"
              }`}
            >
              {pool.change}
            </div>
            <div className="flex-1">{pool.tvl}</div>
            <div className="flex-1">{pool.volume}</div>
            <div className="flex-1">Graph Placeholder</div>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
