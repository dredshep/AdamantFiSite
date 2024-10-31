// pages/tokens.tsx
import AppLayout from "@/components/app/Global/AppLayout";
import {
  FinancialDataRow,
  FinancialTableSearchBar,
  TableHeaders,
} from "@/components/app/Shared/Tables/FinancialTable";
import TokenDisplay from "@/components/app/Shared/Tables/TokenDisplay";
import { SecretString } from "@/types";
import { Token, TokensResponse } from "@/types/api/TokensResponse";
import { GetStaticProps } from "next";
import Link from "next/link";

interface TokensPageProps {
  tokens: Token[];
}

export const getStaticProps: GetStaticProps = async () => {
  const res = await fetch(
    "https://api-bridge-mainnet.azurewebsites.net/tokens/?page=0&size=1000"
  );
  const data = (await res.json()) as TokensResponse;

  return {
    props: {
      tokens: data.tokens,
    },
  };
};

const TokensPage: React.FC<TokensPageProps> = ({ tokens }) => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto mt-12">
        <div className="flex justify-center mb-8">
          <FinancialTableSearchBar
            placeholder="Search token or paste address"
            onSearch={(value) => console.log(value)}
          />
        </div>
        <TableHeaders
          headers={[
            { title: "Token", minWidth: "240px" },
            { title: "Price" },
            { title: "CoinGecko Symbol" },
            { title: "Network" },
          ]}
        />
        <div className="rounded-b-[10px] overflow-hidden">
          {tokens.map((token) => (
            <Link
              key={token._id}
              href={`/app/token/${token.src_network}/${token.src_address}`}
              className="flex items-center bg-adamant-box-dark hover:brightness-125 select-none py-4 px-6"
            >
              <FinancialDataRow
                cells={[
                  {
                    content: (
                      <TokenDisplay
                        seed={token.src_address as SecretString}
                        name={token.name}
                        // network={token.src_network}
                      />
                    ),
                    minWidth: "240px",
                  },
                  {
                    content: "$ " + parseFloat(token.price).toFixed(2),
                    bold: true,
                  },
                  {
                    content: token.display_props.symbol,
                  },
                  { content: token.dst_network },
                ]}
              />
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default TokensPage;
