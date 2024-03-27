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
  index,
  length,
  alt,
  size,
}: ImageWithPlaceholderProps) {
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(imageUrl);

  const zIndex = length - index;
  const marginLeft = index === 0 ? "" : "-7px";

  const handleError = () => {
    setCurrentImageUrl(placeholderUrl);
  };
  const defaultSize = 48;
  const pixelSize = size || defaultSize;
  const stringifiedSizeWithPx = `${pixelSize}px`;

  return (
    <div
      style={{
        marginLeft,
        zIndex,
        position: "relative",
        width: stringifiedSizeWithPx,
        height: stringifiedSizeWithPx,
      }}
      className="rounded-circle"
    >
      <Image
        src={currentImageUrl}
        alt={alt}
        onError={handleError}
        className="rounded-circle object-cover rounded-full"
        height={pixelSize} // Dynamic size
        width={pixelSize} // Dynamic size
      />
    </div>
  );
}

export default ImageWithPlaceholder;
