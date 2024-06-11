import Image from "next/image";
import { useState } from "react";

interface ImageWithPlaceholderProps {
  imageUrl: string;
  placeholderUrl: string;
  index: number;
  length: number;
  alt: string;
  size: number; // Size in pixels
}

function ImageWithPlaceholder({
  imageUrl,
  placeholderUrl,
  alt,
  size,
}: ImageWithPlaceholderProps) {
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(imageUrl);

  const handleError = () => {
    setCurrentImageUrl(placeholderUrl);
  };
  const defaultSize = 48;
  const pixelSize = size || defaultSize;

  return (
    <Image
      src={currentImageUrl}
      alt={alt}
      onError={handleError}
      className="rounded-circle object-cover rounded-full"
      height={pixelSize}
      width={pixelSize}
    />
  );
}

export default ImageWithPlaceholder;
