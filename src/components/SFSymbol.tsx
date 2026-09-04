import React from 'react';
import clsx from 'clsx';

interface SFSymbolProps {
  src: string;
  fallbackPng?: string;
  className?: string;
  alt?: string;
}

export const SFSymbol: React.FC<SFSymbolProps> = ({
  src,
  fallbackPng,
  className = 'w-6 h-6',
  alt = 'icon',
}) => {
  // Use SVG or PNG via CSS mask for native tinting
  const iconUrl = src || fallbackPng || '';

  return (
    <span
      role="img"
      aria-label={alt}
      className={clsx(
        'inline-block select-none transition-colors duration-150',
        'bg-current',
        className
      )}
      style={{
        maskImage: `url("${iconUrl}")`,
        WebkitMaskImage: `url("${iconUrl}")`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
      }}
    />
  );
};
