import {
  MobileSearchButton,
  MobileSearchButton as MobileSearchButtonRefactored,
} from '@/components/app/Global/SmartSearchRefactor';
import SmartSearchBoxRefactored from '@/components/app/Global/SmartSearchRefactor/SmartSearchBox';
import UserWallet from '@/components/app/Global/UserWallet';
import AdamantFiLogo from '@/components/SVG/Logo';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

const Navbar: React.FC = () => {
  const router = useRouter();

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  return (
    <div className="px-4 md:px-6 relative w-full">
      {/* Main flex container for left and right sections */}
      <div className="flex w-full justify-between items-center">
        {/* Left side - Logo and Navigation */}
        <div className="flex items-center gap-4 md:gap-9">
          <Link href="/" passHref>
            <div className="flex items-center cursor-pointer">
              <AdamantFiLogo className="h-8 w-8 md:h-10 md:w-10" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 uppercase text-base font-medium leading-6">
            <Link href="/" passHref>
              <div
                className={`cursor-pointer text-white pb-1 px-2 transition-all duration-200 ${
                  isActive('/')
                    ? 'border-b-2 border-[#8A754A]'
                    : 'border-b-2 border-transparent brightness-50 hover:brightness-75'
                }`}
              >
                Swap
              </div>
            </Link>
            <Link href="/pools" passHref>
              <div
                className={`cursor-pointer text-white pb-1 px-2 transition-all duration-200 ${
                  isActive('/pools')
                    ? 'border-b-2 border-[#8A754A]'
                    : 'border-b-2 border-transparent brightness-50 hover:brightness-75'
                }`}
              >
                Pools
              </div>
            </Link>
          </div>
        </div>

        {/* Right side - Mobile Search + Wallet */}
        <div className="flex items-center gap-3">
          {/* Mobile Search Button */}
          <div className="lg:hidden flex gap-2">
            <div className="relative">
              <MobileSearchButton />
              <div className="absolute -bottom-5 left-0 text-xs text-white/50 whitespace-nowrap">
                Original
              </div>
            </div>
            <div className="relative">
              <MobileSearchButtonRefactored />
              {/* <div className="absolute -bottom-5 left-0 text-xs text-white/50 whitespace-nowrap">
                Refactored
              </div> */}
            </div>
          </div>

          {/* Mobile Navigation Menu - Only show on very small screens */}
          <div className="md:hidden">
            <div className="flex items-center gap-2 text-xs">
              <Link href="/" passHref>
                <div
                  className={`cursor-pointer text-white px-2 py-1 rounded transition-all duration-200 ${
                    isActive('/')
                      ? 'bg-[#8A754A]/20 text-[#8A754A]'
                      : 'brightness-50 hover:brightness-75'
                  }`}
                >
                  Swap
                </div>
              </Link>
              <Link href="/pools" passHref>
                <div
                  className={`cursor-pointer text-white px-2 py-1 rounded transition-all duration-200 ${
                    isActive('/pools')
                      ? 'bg-[#8A754A]/20 text-[#8A754A]'
                      : 'brightness-50 hover:brightness-75'
                  }`}
                >
                  Pools
                </div>
              </Link>
            </div>
          </div>

          <UserWallet />
        </div>
      </div>

      {/* Center - Desktop Search - Absolutely centered */}
      <div className="hidden lg:block absolute left-1/2 top-0 transform -translate-x-1/2 w-full max-w-2xl px-8 pointer-events-none h-full flex items-center">
        <div className="space-y-1 pointer-events-auto w-full">
          <SmartSearchBoxRefactored
            className="w-full"
            placeholder="Type a command or press Ctrl+K..."
          />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
