import React from "react";
import ImageWithPlaceholder from "@/components/app/ImageWithPlaceholder";
import { SecretString } from "@/types";
import generateHexColorsFromSeed from "@/utils/ImageWithPlaceholder/generateHexColorsFromSeed";

interface PlaceholderImageFromSeedProps {
  seed: SecretString;
  size?: number;
}

const PlaceholderImageFromSeed: React.FC<PlaceholderImageFromSeedProps> = ({
  seed,
  size = 48,
}) => {
  const [color1, color2, color3] = generateHexColorsFromSeed(seed, 3);
  const colorQueryString = `shape1Color=${color1}&shape2Color=${color2}&shape3Color=${color3}`;
  const placeholderUrl = `https://api.dicebear.com/6.x/shapes/svg?seed=${seed}&height=${size}&width=${size}&${colorQueryString}`;

  return (
    <ImageWithPlaceholder
      imageUrl={placeholderUrl}
      placeholderUrl={placeholderUrl}
      index={1}
      length={2}
      alt="Avatar"
      size={size}
      key={seed}
    />
  );
};

export default PlaceholderImageFromSeed;
