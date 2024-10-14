import Logo from "@/components/SVG/logo";
import CoolBox from "@/components/site/CoolBox";
import InfoBox from "@/components/site/InfoBox";
import Footer from "@/components/site/Footer";
import Head from "next/head";
import Link from "next/link";

const coolBoxes = (
  <div className="flex flex-wrap gap-8">
    <CoolBox
      icon="/icons/coolBox/1.svg"
      mainText="Exchange tokens without trace"
      secondaryText="Swap SNIP-20 tokens"
      buttonText="SWAP PRIVATELY"
      link="/swap-privately"
      type="dark"
    />
    <CoolBox
      icon="/icons/coolBox/2.svg"
      mainText="Provide liquidity and earn by staking"
      secondaryText="Earn trading fees and incentives"
      buttonText="ADD LIQUIDITY"
      link="/add-liquidity"
      type="light"
    />
    <CoolBox
      icon="/icons/coolBox/3.svg"
      mainText={
        <>
          Explore <br />
          Secret Network
        </>
      }
      secondaryText="SNIP-20 token list"
      buttonText="TOKENS ON SECRET"
      link="/tokens-on-secret"
      type="dark"
      alt="Explore Secret Network"
    />
  </div>
);
const infoBoxes = (
  <div className="flex flex-wrap gap-4 w-full">
    <InfoBox
      title="Grants"
      description="Would you like to build a new protocol for Adamant or implement our liquidity?"
      buttonText="APPLY FOR A GRANT"
      link="https://adamantfi.gitbook.io/documentation/"
    />
    <InfoBox
      title="Infra and SDKs"
      description="Adamant tech stack offers many solutions that can provide your application the necessary infrastructure."
      buttonText="LEARN MORE"
      link="https://github.com/dredshep/AdamantFiSite"
    />
  </div>
);

export default function Home() {
  return (
    <div className={"bg-tubeshapes-dark bg-cover min-h-screen text-white"}>
      <Head>
        <title>Adamant Finance - Secure & Private DeFi Solutions</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="px-6 py-8 flex w-full justify-between">
        <Link className="flex items-center " href="/">
          <Logo className="h-10 w-10" />
          <div className="text-white text-2xl font-bold tracking-wider ml-2">
            ADAMANT<span className="text-adamant-dark">.FI</span>
          </div>
        </Link>
        <div className="flex items-center space-x-11 uppercase text-base font-medium">
          <Link
            href="#"
            className="hidden lg:block text-white border-b-2 border-[#8A754A] pb-2 px-2"
          >
            Products
          </Link>
          <Link
            href="https://github.com/dredshep/AdamantFiSite"
            className="hidden lg:block text-white brightness-50 pb-2 px-2"
          >
            Developers
          </Link>
          <Link
            href="https://forum.scrt.network/"
            className="hidden lg:block text-white brightness-50 pb-2 px-2"
          >
            Governance
          </Link>
          <Link
            href="/app"
            className="text-black uppercase bg-white px-4 py-2 rounded-lg text-base font-bold"
          >
            Launch <span className="hidden sm:inline-block">App</span>
          </Link>
        </div>
      </div>
      <div className="max-w-[1176px] mx-auto px-10">
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
