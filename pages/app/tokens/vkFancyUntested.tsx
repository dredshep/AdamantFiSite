// vkFancyUntested.ts
import React, { useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/app/Global/AppLayout";
import TokenDisplay from "@/components/app/Shared/Tables/TokenDisplay";
import RegisterTokenButton from "@/components/app/Shared/Buttons/RegisterTokenButton";
import SyncViewingKeyButton from "@/components/app/Shared/Buttons/SyncViewingKeyButton";
import {
  TableHeaders,
  FinancialDataRow,
  FinancialTableSearchBar,
} from "@/components/app/Shared/Tables/FinancialTable";
import { useTokens } from "@/utils/secretjs/useTokensFancyUntested"; // Importing the custom hook

export default function TokensPage() {
  const { tokens, isLoading, error } = useTokens("secret-4");
  const [searchTerm, setSearchTerm] = useState("");

  // Filtering tokens based on the search term
  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return <div>Error loading tokens: {error.message}</div>;
  }

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
            onSearch={setSearchTerm} // This will set the search term in state
          />
        </div>
        <TableHeaders
          headers={[
            { title: "Token", minWidth: "240px" },
            { title: "Actions", align: "end" },
          ]}
        />
        {isLoading ? (
          <div>Loading tokens...</div>
        ) : (
          <div className="rounded-b-[10px] overflow-hidden">
            {filteredTokens.length > 0 ? (
              filteredTokens.map((token, index) => (
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
              ))
            ) : (
              <div>No tokens found.</div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
