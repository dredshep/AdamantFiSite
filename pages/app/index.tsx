import { Jura } from "next/font/google";
import Logo from "@/components/SVG/logo";
import CoolBox from "@/components/CoolBox";
import InfoBox from "@/components/InfoBox";
import Footer from "@/components/Footer";
import Head from "next/head";
import UserWallet from "@/components/app/UserWallet";
import Link from "next/link";
import SwapForm from "@/components/organisms/SwapForm";
import ComboboxForm from "@/components/organisms/SwapForm";

const jura = Jura({ subsets: ["latin"] });

const coolBoxes = (
  <div className="flex gap-8">
    <CoolBox
      icon="/icons/coolBox/1.svg" // Replace with your actual icon path
      mainText="Exchange tokens without trace"
      secondaryText="Swap SNIP-20 tokens"
      buttonText="SWAP PRIVATELY"
      link="/swap-privately" // Replace with your actual link
      type="dark"
    />
    <CoolBox
      icon="/icons/coolBox/2.svg" // Replace with your actual icon path
      mainText="Provide liquidity and earn by staking"
      secondaryText="Earn trading fees and incentives"
      buttonText="ADD LIQUIDITY"
      link="/add-liquidity" // Replace with your actual link
      type="light"
    />
    <CoolBox
      icon="/icons/coolBox/3.svg" // Replace with your actual icon path
      mainText={
        <>
          Explore <br />
          Secret Network
        </>
      }
      secondaryText="SNIP-20 token list"
      buttonText="TOKENS ON SECRET"
      link="/tokens-on-secret" // Replace with your actual link
      type="dark"
      alt="Explore Secret Network"
    />
  </div>
);
const infoBoxes = (
  <div className="flex gap-4 w-full">
    {" "}
    {/* Adjust this gap if necessary */}
    <InfoBox
      title="Grants"
      description="Would you like to build a new protocol for Adamant or implement our liquidity?"
      buttonText="APPLY FOR A GRANT"
      link="/grants" // Replace with your actual link
    />
    <InfoBox
      title="Infra and SDKs"
      description="Adamant tech stack offers many solutions that can provide your application the necessary infrastructure."
      buttonText="LEARN MORE"
      link="/infra-and-sdks" // Replace with your actual link
    />
  </div>
);

// Then render infoBoxes where you need it in your component tree.

export default function Home() {
  return (
    <div
      className={
        jura.className +
        " bg-tubeshapes-light bg-cover min-h-screen pb-20 text-white"
      }
    >
      <Head>
        <title>Adamant Finance - Secure & Private DeFi Solutions</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="px-6 py-8 flex w-full justify-between">
        {/* logo */}
        <Link className="flex items-center " href="/">
          <Logo className="h-10 w-10" />
          <div className="text-white text-lg font-bold leading-6 tracking-wider ml-2">
            ADAMANT<span className="text-adamant-dark">.FI</span>
          </div>
        </Link>

        {/* nav */}
        <div className="flex items-center space-x-11 uppercase text-base font-medium leading-6">
          <Link
            href="#"
            className="text-white border-b-2 border-[#8A754A] pb-1 px-2"
          >
            Swap
          </Link>
          <Link
            href="#"
            className="text-white border-b-2 border-transparent brightness-50 pb-1 px-2"
          >
            Tokens
          </Link>
          <Link
            href="#"
            className="text-white border-b-2 border-transparent brightness-50 pb-1 px-2"
          >
            Pools
          </Link>
        </div>
        <UserWallet
          isConnected={true}
          userAddress="0x1234567890abcdef"
          balanceSCRT={0}
          balanceADMT={0}
          onConnect={() => console.log("connect")}
        />
      </div>
      {/* container div simply setting max width and perhaps other settings for content only */}
      <div className="max-w-[1176px] mx-auto">
        <div className="flex gap-4 justify-between leading-6">
          <div className="flex gap-4">
            <div className="font-bold flex flex-col relative pl-5">
              SWAP
              <div className="relative">
                <div
                  className="w-0 h-0 absolute left-3
  border-l-[8px] border-l-transparent
  border-b-[8px] border-b-[#30364E]
  border-r-[8px] border-r-transparent"
                ></div>
              </div>
            </div>
            <div className="brightness-50 font-medium">SEND</div>
          </div>
          <div>+ Add liquidity for SRCT/SHD</div>
        </div>
        <div className="bg-[#30364E] w-[400px] h-[400px] leading-none rounded-xl text-xl uppercase mt-2 p-5">
          <ComboboxForm />
        </div>
        <Footer />
      </div>
    </div>
  );
}
