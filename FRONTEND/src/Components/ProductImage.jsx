import { useEffect, useState } from "react";
import fallbackImage from "../images/product-image-fallback.svg";
import { getProductImageUrl } from "../api";

export default function ProductImage({ image, alt = "", ...imageProps }) {
  const imageUrl = getProductImageUrl(image);
  const [failedUrl, setFailedUrl] = useState("");
  const showFallback = !imageUrl || failedUrl === imageUrl;

  useEffect(() => {
    if (!imageUrl) {
      console.error("Product image is missing a usable URL.", { image, alt });
    }
  }, [alt, image, imageUrl]);

  function handleError(event) {
    if (showFallback) {
      console.error("HerbHaven product fallback image failed to load.", {
        src: event.currentTarget.src,
      });
      return;
    }

    console.error("HerbHaven product image failed to load.", {
      image,
      src: imageUrl,
    });
    setFailedUrl(imageUrl);
  }

  return (
    <img
      {...imageProps}
      src={showFallback ? fallbackImage : imageUrl}
      alt={alt}
      onError={handleError}
    />
  );
}
