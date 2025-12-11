import React from 'react';
import ColorCardPlaceholder from './ColorCardPlaceholder';
import { useImageWithFallback } from '../utils/imageFallback';

interface SmartImageProps {
  imageUrl: string | null | undefined;
  fallbackId: string;
  fallbackText?: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

/**
 * Smart image component that automatically falls back to solid color placeholders
 * when images fail to load (e.g., in corporate networks where Pollinations.ai is blocked)
 */
const SmartImage: React.FC<SmartImageProps> = ({
  imageUrl,
  fallbackId,
  fallbackText,
  alt,
  className = "",
  style = {},
  'aria-label': ariaLabel,
}) => {
  const { showFallback, imageLoaded } = useImageWithFallback(imageUrl, fallbackId, fallbackText);

  if (showFallback || !imageUrl) {
    return (
      <ColorCardPlaceholder
        id={fallbackId}
        text={fallbackText}
        className={className}
        style={style}
        aria-label={ariaLabel || alt}
      />
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={style}
      aria-label={ariaLabel}
      loading="lazy"
    />
  );
};

export default SmartImage;