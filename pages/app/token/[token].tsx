// pages/tokens/[token].tsx
import { useRouter } from "next/router";
import AppLayout from "@/components/app/compositions/AppLayout";
import React from "react";

// Mock token details data
const tokenDetails = {
  "0x6545454465153231231231": {
    name: "SCRT",
    network: "Secret Network",
    totalVolumeLocked: "$500K",
    marketCap: "$1M",
    fdv: "$2M",
    dailyVolume: "$50K",
    about: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  "0xacd6a516c51a651da65c165d1": {
    name: "ADMT",
    network: "Secret Network",
    totalVolumeLocked: "$200K",
    marketCap: "$800K",
    fdv: "$1.5M",
    dailyVolume: "$20K",
    about:
      "Pellentesque habitant morbi tristique senectus et netus et malesuada.",
  },
};

const TokenPage = () => {
  const router = useRouter();
  const { token } = router.query;

  const details = tokenDetails[token as keyof typeof tokenDetails];

  if (!details) {
    return <p>Token not found</p>; // Or any other error handling
  }

  return (
    <AppLayout>
      <div className="bg-cover min-h-screen pb-20 text-white">
        <div className="max-w-4xl mx-auto mt-12">
          {/* Breadcrumb */}
          <div className="mb-8">Tokens &gt; {details.name}</div>

          {/* Statistics Box */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Statistics</h2>
            <table className="w-full">
              <tbody>
                <tr>
                  <td>Total Volume Locked</td>
                  <td>{details.totalVolumeLocked}</td>
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
            <p>{details.about}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default TokenPage;
