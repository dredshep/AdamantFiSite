import ImageWithPlaceholder from '@/components/app/Shared/ImageWithPlaceholder';
import { SecretString } from '@/types';
import generateHexColorsFromSeed from '@/utils/ImageWithPlaceholder/generateHexColorsFromSeed';
import React, { useMemo } from 'react';

interface PlaceholderImageFromSeedProps {
  seed: SecretString;
  size?: number;
}

const PlaceholderImageFromSeed: React.FC<PlaceholderImageFromSeedProps> = ({ seed, size = 48 }) => {
  const [color1, color2, color3] = generateHexColorsFromSeed(seed, 3);
  const colorQueryString = `shape1Color=${color1}&shape2Color=${color2}&shape3Color=${color3}`;

  const placeholderUrl = useMemo(
    () => `/api/placeholder-image?seed=${seed}&size=${size}&${colorQueryString}`,
    [seed, size, color1, color2, color3]
  );

  return (
    <ImageWithPlaceholder
      imageUrl={placeholderUrl}
      placeholderUrl={placeholderUrl}
      index={1}
      length={2}
      alt="Avatar"
      size={size}
    />
  );
};

export default PlaceholderImageFromSeed;
