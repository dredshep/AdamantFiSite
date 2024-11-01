import AppLayout from "@/components/app/Global/AppLayout";
import SwapForm from "@/components/app/Pages/Swap/SwapForm/SwapForm";
import ResponsiveVegaChart from "@/components/app/Shared/Charts/ResponsiveVegaChart";
import { Token } from "@/types";
import { getApiTokens } from "@/utils/apis/getSwappableTokens";
import chartSpec from "@/utils/dummyData/lineChart.json";
import values from "@/utils/dummyData/lineChartValues.json";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { VisualizationSpec } from "react-vega";

// Mock token details data
// const tokenDetails = {
//   secret16545454465153231231231: {
//     name: "SCRT",
//     network: "Secret Network",
//     totalVolumeLocked: "$500K",
//     marketCap: "$1M",
//     fdv: "$2M",
//     dailyVolume: "$50K",
//     about: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
//   },
//   secret1acd6a516c51a651da65c165d1: {
//     name: "ADMT",
//     network: "Secret Network",
//     totalVolumeLocked: "$200K",
//     marketCap: "$800K",
//     fdv: "$1.5M",
//     dailyVolume: "$20K",
//     about:
//       "Pellentesque habitant morbi tristique senectus et netus et malesuada.",
//   },
// };

const TokenPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const [tokenDetails, setTokenDetails] = React.useState<Token[]>([]);
  useEffect(() => {
    void getApiTokens().then((data) => {
      setTokenDetails(data);
    });
  }, []);

  const rawDetails = tokenDetails.find((t) => t.address === token);

  const details = rawDetails
    ? {
        name: rawDetails.name,
        // network: rawDetails.network ?? "Unknown",
        // totalVolumeLocked: rawDetails.balance ?? "N/A",
        // marketCap: rawDetails.balance ?? "N/A",
        // fdv: rawDetails.balance ?? "N/A",
        // dailyVolume: rawDetails.balance ?? "N/A",
        // about: rawDetails.description ?? "No description available.",
      }
    : null;

  if (!details) {
    return <div>Token not found</div>; // TODO: Better Not Found page
  }

  return (
    <AppLayout>
      <div className="bg-cover min-h-screen text-white">
        <div className="max-w-4xl mx-auto mt-12">
          {/* Breadcrumb */}
          <div className="mb-8">Tokens &gt; {details.name}</div>
          <div>
            <h1>Chart time</h1>
            <ResponsiveVegaChart
              spec={chartSpec as VisualizationSpec}
              values={values}
            />
          </div>

          {/* Statistics Box */}
          {/* <div className="mb-8">
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
          </div> */}

          {/* My Transactions Box (Placeholder) */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">My Transactions</h2>
            {/* Implement the table or fetch transaction data */}
          </div>

          {/* Swap Form Placeholder */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Swap</h2>
            <SwapForm />
          </div>

          {/* About Text */}
          {/* <div>
            <h2 className="text-xl font-bold mb-4">About {details.name}</h2>
            <div>{details.about}</div>
          </div> */}
        </div>
      </div>
    </AppLayout>
  );
};

export default TokenPage;
