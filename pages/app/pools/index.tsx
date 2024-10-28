import TokenDisplay from "@/components/app/Shared/Tables/TokenDisplay";
import AppLayout from "@/components/app/Global/AppLayout";
import { SecretString, TablePool } from "@/types";
import Link from "next/link";
import {
  TableHeaders,
  FinancialDataRow,
  FinancialTableSearchBar,
} from "@/components/app/Shared/Tables/FinancialTable";
import { useEffect, useState } from "react";
import { getTablePools } from "@/utils/apis/getTablePools";
import { validatePools } from "@/utils/apis/isPoolConfigured";

interface ValidatedPool extends TablePool {
  isValid: boolean;
  validationReason: string | undefined;
}

export default function PoolsPage() {
  const [pools, setPools] = useState<ValidatedPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllPools, setShowAllPools] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAndValidatePools = async () => {
      try {
        const poolsData = await getTablePools();
        const validationResults = await validatePools(poolsData);

        const validatedPools: ValidatedPool[] = poolsData.map(
          (pool, index) => ({
            ...pool,
            isValid: validationResults[index]?.isValid ?? false,
            validationReason: validationResults[index]?.reason,
          })
        );

        setPools(validatedPools);
      } catch (error) {
        console.error("Error fetching and validating pools:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchAndValidatePools();
  }, []);

  const filteredPools = pools.filter((pool) => {
    const matchesSearch =
      pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.contract_address.toLowerCase().includes(searchTerm.toLowerCase());
    return showAllPools
      ? matchesSearch
      : matchesSearch && pool.isValid === true;
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-screen">
          Loading...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto mt-12">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-center">
            <FinancialTableSearchBar
              placeholder="Search pool or paste address"
              onSearch={setSearchTerm}
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Show all pools</label>
              <input
                type="checkbox"
                checked={showAllPools}
                onChange={(e) => setShowAllPools(e.target.checked)}
                className="form-checkbox h-4 w-4 text-adamant-primary rounded border-gray-300"
              />
            </div>
          </div>
          {showAllPools === true && (
            <div className="text-yellow-500 text-sm">
              Warning: Some pools shown may not be properly configured and could
              cause errors when interacting with them.
            </div>
          )}
        </div>

        <TableHeaders
          headers={[
            { title: "Pool", minWidth: "240px" },
            { title: "Status" },
            { title: "Price" },
            { title: "Change" },
            { title: "TVL" },
          ]}
        />
        <div className="rounded-b-[10px] overflow-hidden">
          {filteredPools.map((pool, index) => (
            <Link
              key={index}
              className="flex items-center bg-adamant-box-dark hover:brightness-125 select-none py-4 px-6"
              href={`/app/pool/${pool.contract_address}`}
            >
              <FinancialDataRow
                cells={[
                  {
                    content: (
                      <TokenDisplay
                        seed={pool.contract_address as SecretString}
                        name={pool.name}
                        network={pool.network}
                      />
                    ),
                    minWidth: "240px",
                  },
                  {
                    content: (
                      <div
                        className={`text-sm ${
                          pool.isValid === true
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {pool.isValid === true ? "Valid" : "Invalid"}
                        {pool.isValid === false &&
                          typeof pool.validationReason === "string" && (
                            <span className="block text-xs text-gray-400">
                              {pool.validationReason}
                            </span>
                          )}
                      </div>
                    ),
                  },
                  // Add other cells as needed
                ]}
              />
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
