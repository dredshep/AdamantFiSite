// PlaceholderFromHexAddress.tsx
import React from "react";
import ImageWithPlaceholder from "@/components/app/ImageWithPlaceholder";
import addressTo3Colors from "@/utils/ImageWithPlaceholder/addressTo3Colors";
import stringToHex from "@/utils/ImageWithPlaceholder/stringToHex";
import { SecretString } from "@/types";

interface PlaceholderFromHexAddressProps {
  userAddress: SecretString;
  size?: number; // Changed to a single number for consistency
}

const PlaceholderFromHexAddress: React.FC<PlaceholderFromHexAddressProps> = ({
  userAddress,
  size = 48, // Default size as a single number, assuming a square for simplicity
}) => {
  const hexAddress = stringToHex(userAddress);
  const colorsString = addressTo3Colors(hexAddress);
  const placeholderUrl = `https://api.dicebear.com/6.x/shapes/svg?seed=${hexAddress}&height=${size}&width=${size}&${colorsString}`;

  return (
    <ImageWithPlaceholder
      imageUrl={placeholderUrl}
      placeholderUrl={placeholderUrl}
      index={1}
      length={2}
      alt="Avatar"
      size={size} // Pass the size as a single number
    />
  );
};

export default PlaceholderFromHexAddress;
