import Image from "next/image";
import { useState } from "react";

interface ImageWithPlaceholderProps {
  imageUrl: string;
  placeholderUrl: string;
  index: number;
  length: number;
  alt: string;
}

function ImageWithPlaceholder({
  imageUrl,
  placeholderUrl,
  index,
  length,
  alt,
}: ImageWithPlaceholderProps) {
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(imageUrl);

  const zIndex = length - index;
  const marginLeft = index === 0 ? "" : "-7px";

  const handleError = () => {
    setCurrentImageUrl(placeholderUrl);
  };

  return (
    <div
      style={{
        marginLeft,
        zIndex,
        position: "relative",
        width: "48px",
        height: "48px",
      }}
      className="rounded-circle"
    >
      <Image
        src={currentImageUrl}
        alt={alt}
        onError={handleError}
        className="rounded-circle object-cover rounded-full"
        height={48}
        width={48}
      />
    </div>
  );
}

export default ImageWithPlaceholder;
