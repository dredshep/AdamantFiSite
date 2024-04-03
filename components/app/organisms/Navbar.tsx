import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Logo from "@/components/SVG/logo";
import UserWallet from "@/components/app/UserWallet";

const Navbar: React.FC = () => {
  const router = useRouter();

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  return (
    <div className="px-6 py-8 flex w-full justify-between">
      <Link href="/" passHref>
        <div className="flex items-center cursor-pointer">
          <Logo className="h-10 w-10" />
          <div className="text-white text-lg font-bold leading-6 tracking-wider ml-2">
            ADAMANT<span className="text-adamant-dark">.FI</span>
          </div>
        </div>
      </Link>
      <div className="flex items-center space-x-11 uppercase text-base font-medium leading-6">
        <Link href="/app" passHref>
          <div
            className={`cursor-pointer text-white pb-1 px-2 ${
              isActive("/app")
                ? "border-b-2 border-[#8A754A]"
                : "border-b-2 border-transparent brightness-50"
            }`}
          >
            Swap
          </div>
        </Link>
        <Link href="/app/tokens" passHref>
          <div
            className={`cursor-pointer text-white pb-1 px-2 ${
              isActive("/app/tokens")
                ? "border-b-2 border-[#8A754A]"
                : "border-b-2 border-transparent brightness-50"
            }`}
          >
            Tokens
          </div>
        </Link>
        <Link href="/app/pools" passHref>
          <div
            className={`cursor-pointer text-white pb-1 px-2 ${
              isActive("/app/pools")
                ? "border-b-2 border-[#8A754A]"
                : "border-b-2 border-transparent brightness-50"
            }`}
          >
            Pools
          </div>
        </Link>
      </div>
      <UserWallet
        isConnected={true}
        userAddress="secret1234567890abcdef"
        balanceSCRT={0}
        balanceADMT={0}
        onConnect={() => console.log("connect")}
      />
    </div>
  );
};

export default Navbar;
