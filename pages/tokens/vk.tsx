import TokenDisplay from "@/components/app/Shared/Tables/TokenDisplay";
import AppLayout from "@/components/app/Global/AppLayout";
import RegisterTokenButton from "@/components/app/Shared/Buttons/RegisterTokenButton";
import SyncViewingKeyButton from "@/components/app/Shared/Buttons/SyncViewingKeyButton";
import { TableToken } from "@/types";
import Link from "next/link";
import {
  TableHeaders,
  FinancialDataRow,
  FinancialTableSearchBar,
} from "@/components/app/Shared/Tables/FinancialTable";
import { useEffect, useState } from "react";
import { getTableTokens } from "@/utils/apis/getTableTokens";
import isNotNullish from "@/utils/isNotNullish";
import { Window } from "@keplr-wallet/types";

export default function TokensPage() {
  const [tokens, setTokens] = useState<TableToken[]>([]);
  const chainId = "secret-4";

  useEffect(() => {
    async function main() {
      const tableTokens = await getTableTokens();
      console.log({ tableTokens });
      setTokens(tableTokens);

      if (!isNotNullish((window as unknown as Window).keplr)) {
        alert("Keplr extension not installed");
        return;
      }
      await (window as unknown as Window).keplr?.enable(chainId);
    }
    void main();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto mt-12">
        <h2 className="text-lg font-bold mb-4">Token Management</h2>
        <p className="mb-8 text-gray-600">
          Below you can manage SNIP-20 tokens. Use the &quot;Sync Key&quot;
          button to synchronize the viewing key for each token with your Keplr
          wallet, or use the &quot;Register Token&quot; button to add the token
          to your Keplr wallet.
        </p>
        <div className="flex justify-between mb-8">
          <FinancialTableSearchBar
            placeholder="Search token or paste address"
            onSearch={(value) => console.log(value)}
          />
        </div>
        <TableHeaders
          headers={[
            { title: "Token", minWidth: "240px" },
            { title: "Actions", align: "end" },
          ]}
        />
        <div className="rounded-b-[10px] overflow-hidden">
          {tokens.map((token, index) => (
            <div
              key={index}
              className="flex items-center bg-adamant-box-dark hover:brightness-125 select-none py-4 px-6"
            >
              <Link href={`/app/token/${token.address}`} className="flex-1">
                <FinancialDataRow
                  cells={[
                    {
                      content: (
                        <TokenDisplay
                          seed={token.address}
                          name={token.name}
                          // network={token.network}
                        />
                      ),
                      minWidth: "240px",
                    },
                  ]}
                />
              </Link>
              <div className="flex space-x-4 justify-end">
                <SyncViewingKeyButton tokenAddress={token.address} />
                <RegisterTokenButton tokenAddress={token.address} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
