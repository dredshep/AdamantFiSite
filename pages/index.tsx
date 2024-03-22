import { Jura } from "next/font/google";
import Logo from "@/components/SVG/logo";
import CoolBox from "@/components/CoolBox";
import InfoBox from "@/components/InfoBox";
import Footer from "@/components/Footer";
import Head from "next/head";
import Link from "next/link";

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
        " bg-tubeshapes-dark bg-cover min-h-screen pb-20 text-white"
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
          <div className="text-white text-2xl font-bold tracking-wider ml-2">
            ADAMANT<span className="text-adamant-dark">.FI</span>
          </div>
        </Link>

        {/* nav */}
        <div className="flex items-center space-x-11 uppercase text-base font-medium">
          <a
            href="#"
            className="text-white border-b-2 border-[#8A754A] pb-2 px-2"
          >
            Products
          </a>
          <a href="#" className="text-white brightness-50 pb-2 px-2">
            Developers
          </a>
          <a href="#" className="text-white brightness-50 pb-2 px-2">
            Governance
          </a>
          <Link
            href="/app"
            className="text-black uppercase bg-white px-4 py-2 rounded-lg text-base font-bold"
          >
            Launch App
          </Link>
        </div>
      </div>
      {/* container div simply setting max width and perhaps other settings for content only */}
      <div className="max-w-[1176px] mx-auto">
        <div className="mt-32">
          <div className="flex flex-col items-center gap-6">
            <div className="text-4xl font-bold tracking-wider">
              ADAMANT<span className="text-adamant-dark">.FI</span>
            </div>
            <div className="leading-10 text-2xl max-w-[585px] brightness-50 text-center">
              Permissionless, opensource and community owned liquidity protocol
              on Secret Network
            </div>
            <div className="uppercase px-9 py-3 leading-6 text-lg bg-gradient-to-br from-adamant-gradientBright to-adamant-gradientDark text-adamant-contrastDark rounded-lg font-bold">
              Swap Tokens
            </div>
          </div>
        </div>
        <div className="mt-32">{coolBoxes}</div>
        <div className="mt-32">{infoBoxes}</div>
        <Footer />
      </div>
    </div>
  );
}
