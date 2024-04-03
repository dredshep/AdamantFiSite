import AppLayout from "@/components/app/compositions/AppLayout";
import PlaceholderImageFromSeed from "@/components/app/molecules/PlaceholderImageFromSeed";
import { SecretString } from "@/types";
import Link from "next/link";

const tokens = [
  {
    userAddress: "secret16545454465153231231231",
    name: "SCRT",
    network: "Secret Network",
    price: "$0.10",
    change: "-5%",
    tvl: "$100K",
    volume: "$48K",
  },
  {
    userAddress: "secret1acd6a516c51a651da65c165d1",
    name: "ADMT",
    network: "Secret Network",
    price: "$0.20",
    change: "10%",
    tvl: "$200K",
    volume: "$101K",
  },
];

export default function TokensPage() {
  return (
    <div className="bg-cover min-h-screen pb-20 text-white">
      <AppLayout>
        <div className="max-w-4xl mx-auto mt-12">
          <div className="flex justify-center mb-8">
            <input
              type="text"
              placeholder="Search token or paste address"
              className="w-full px-4 py-2 bg-adamant-box-dark rounded-xl"
            />
          </div>
          {/* Table Header */}
          <div className="flex text-xs text-gray-500 uppercase bg-adamant-app-box dark:bg-gray-700 dark:text-gray-400 py-3 px-6">
            <div className="flex-1 min-w-60">Token</div>
            <div className="flex-1">Price</div>
            <div className="flex-1">Change</div>
            <div className="flex-1">TVL</div>
            <div className="flex-1">Volume</div>
            <div className="flex-1">Graph</div>
          </div>
          {/* Table Rows */}
          {tokens.map((token, index) => (
            <Link
              key={index}
              className="flex items-center bg-adamant-box-dark hover:brightness-125 select-none py-4 px-6"
              href={`/app/token/${token.userAddress}`}
            >
              <div className="flex-1 flex items-center min-w-60">
                <PlaceholderImageFromSeed
                  seed={token.userAddress as SecretString}
                  size={24}
                />
                <div className="ml-3">
                  <div className="font-bold text-white">{token.name}</div>
                  <div className="text-sm text-gray-400">{token.network}</div>
                </div>
              </div>
              <div className="flex-1 text-white font-bold">{token.price}</div>
              <div
                className={`flex-1 ${
                  token.change.startsWith("-")
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                {token.change}
              </div>
              <div className="flex-1">{token.tvl}</div>
              <div className="flex-1">{token.volume}</div>
              <div className="flex-1">Graph Placeholder</div>
            </Link>
          ))}
        </div>
      </AppLayout>
    </div>
  );
}
