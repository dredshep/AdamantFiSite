import { getTokenImagePath } from '@/config/tokenImages';
import { SecretString } from '@/types';
import Image from 'next/image';
import React, { useState } from 'react';
import PlaceholderImageFromSeed from './PlaceholderImageFromSeed';

interface TokenImageWithFallbackProps {
  tokenAddress: SecretString;
  size?: number;
  className?: string;
  alt?: string;
}

const TokenImageWithFallback: React.FC<TokenImageWithFallbackProps> = ({
  tokenAddress,
  size = 24,
  className = '',
  alt = 'Token',
}) => {
  const [imageError, setImageError] = useState(false);
  const customImagePath = getTokenImagePath(tokenAddress);

  // If no custom image or image failed to load, use placeholder
  if (!customImagePath || imageError) {
    return <PlaceholderImageFromSeed seed={tokenAddress} size={size} />;
  }

  return (
    <Image
      src={customImagePath}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      onError={() => setImageError(true)}
      priority={false}
    />
  );
};

export default TokenImageWithFallback;
