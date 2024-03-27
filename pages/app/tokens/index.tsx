import AppLayout from "@/components/app/compositions/AppLayout";
import PlaceholderFromHexAddress from "@/components/app/molecules/PlaceholderFromHexAddress";
import { HexString } from "@/types";

const tokens = [
  // Placeholder data with userAddress added
  {
    userAddress: "0x6545454465153231231231...",
    name: "SCRT",
    network: "Secret Network",
    price: "$0.10",
    change: "-5%",
    tvl: "$100K",
    volume: "$48K",
  },
  {
    userAddress: "0xacd6a516c51a651da65c165d1...",
    name: "ADMT",
    network: "Secret Network",
    price: "$0.20",
    change: "10%",
    tvl: "$200K",
    volume: "$101K",
  },
  // Add more tokens as needed
];

export default function TokensPage() {
  return (
    <div className={"bg-cover min-h-screen pb-20 text-white"}>
      <AppLayout>
        <div className="max-w-4xl mx-auto mt-12">
          <div className="flex justify-center mb-8">
            <input
              type="text"
              placeholder="Search token or paste address"
              className="w-full px-4 py-2 bg-adamant-box-dark rounded-xl"
            />
          </div>
          <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-500 uppercase bg-adamant-app-box dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="py-3 px-6">
                    Token
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Price
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Change
                  </th>
                  <th scope="col" className="py-3 px-6">
                    TVL
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Volume
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Graph
                  </th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token, index) => (
                  <tr
                    key={index}
                    className="bg-adamant-box-dark hover:brightness-125 select-none hover:cursor-pointer"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <PlaceholderFromHexAddress
                          userAddress={token.userAddress as HexString}
                          size={24}
                        />
                        <div className="ml-3">
                          <div className="font-bold text-white">
                            {token.name}
                          </div>
                          <div className="text-sm text-gray-400">
                            {token.network}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-white font-bold">
                      {token.price}
                    </td>
                    <td
                      className={`py-4 px-6 ${
                        token.change.startsWith("-")
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {token.change}
                    </td>
                    <td className="py-4 px-6">{token.tvl}</td>
                    <td className="py-4 px-6">{token.volume}</td>
                    <td className="py-4 px-6">Graph Placeholder</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AppLayout>
    </div>
  );
}
