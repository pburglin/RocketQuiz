import { useState, useEffect } from 'react';

/**
 * Hook to handle image loading with automatic fallback to solid colors
 * when images fail to load (e.g., in blocked corporate networks)
 */
export const useImageWithFallback = (imageUrl: string | null | undefined, fallbackId: string, fallbackText?: string) => {
  const [showFallback, setShowFallback] = useState(!imageUrl);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setShowFallback(true);
      setImageLoaded(false);
      setImageError(false);
      return;
    }

    // Reset state for new image
    setShowFallback(false);
    setImageLoaded(false);
    setImageError(false);

    const img = new Image();
    
    const handleLoad = () => {
      setImageLoaded(true);
      setImageError(false);
      setShowFallback(false);
    };
    
    const handleError = () => {
      console.log(`Image failed to load, falling back to solid color: ${imageUrl}`);
      setImageError(true);
      setImageLoaded(false);
      setShowFallback(true);
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    img.src = imageUrl;

    // Cleanup
    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [imageUrl]);

  return {
    showFallback,
    imageLoaded,
    imageError,
    fallbackProps: {
      id: fallbackId,
      text: fallbackText,
    },
  };
};

/**
 * Check if an image URL is likely to be blocked (contains blocked domains)
 */
export const isLikelyBlockedImage = (imageUrl: string): boolean => {
  if (!imageUrl) return false;
  
  const blockedDomains = [
    'pollinations.ai',
    'image.pollinations.ai',
  ];
  
  try {
    const url = new URL(imageUrl);
    return blockedDomains.some(domain => url.hostname.includes(domain));
  } catch {
    return false;
  }
};