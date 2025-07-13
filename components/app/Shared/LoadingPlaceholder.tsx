import React from 'react';
import { twMerge } from 'tailwind-merge';

interface LoadingPlaceholderProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingPlaceholder: React.FC<LoadingPlaceholderProps> = ({
  size = 'small',
  className,
}) => {
  const sizeClasses = {
    small: 'h-4 w-16',
    medium: 'h-6 w-20',
    large: 'h-8 w-32',
  };

  const baseClasses = 'bg-white/5 animate-pulse rounded';

  return <div className={twMerge(baseClasses, sizeClasses[size], className)} />;
};
