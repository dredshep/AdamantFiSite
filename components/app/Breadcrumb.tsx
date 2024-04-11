import React from "react";
import Link from "next/link";
import { CaretRightIcon } from "@radix-ui/react-icons";

interface BreadcrumbProps {
  linkPath: string;
  linkText: string;
  currentText: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  linkPath,
  linkText,
  currentText,
}) => {
  return (
    <div className="flex items-center mb-8 gap-1 text-base">
      <Link
        className="flex gap-1 items-center text-gray-500 hover:text-gray-200 transition-all duration-75"
        href={linkPath}
      >
        <div className="">{linkText}</div>
        <CaretRightIcon className="w-4 h-4 mt-0.5" />
      </Link>
      <div className="font-bold">{currentText}</div>
    </div>
  );
};
