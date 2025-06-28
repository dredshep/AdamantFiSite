import { MobileSearchButton, SmartSearchBox } from '@/components/app/Global/SmartSearch';
import UserWallet from '@/components/app/Global/UserWallet';
import Logo from '@/components/SVG/Logo';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

const Navbar: React.FC = () => {
  const router = useRouter();

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  return (
    <div className="px-4 md:px-6 py-6 md:py-8 flex w-full justify-between items-center">
      {/* Left side - Logo and Navigation */}
      <div className="flex items-center gap-4 md:gap-9">
        <Link href="/" passHref>
          <div className="flex items-center cursor-pointer">
            <Logo className="h-8 w-8 md:h-10 md:w-10" />
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

      {/* Center - Desktop Search */}
      <div className="hidden lg:flex flex-1 max-w-md mx-8">
        <SmartSearchBox className="w-full" />
      </div>

      {/* Right side - Mobile Search + Wallet */}
      <div className="flex items-center gap-3">
        {/* Mobile Search Button */}
        <div className="lg:hidden">
          <MobileSearchButton />
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
  );
};

export default Navbar;
