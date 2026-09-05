import React, { useState, useEffect, useCallback, useRef } from 'react';
import clsx from 'clsx';

interface AnimatedClockProps {
  className?: string;
  size?: number;
  intervalMs?: number;
}

/**
 * Animated Alarm Clock Icon
 * - Plays hands rotation animation every 5 seconds (matching lucide-animated/icons/clock)
 * - Includes top bells and button cap details inspired by the OnTime 3D app icon reference
 * - Interactive: re-triggers on click/hover with haptic feedback
 */
export const AnimatedClock: React.FC<AnimatedClockProps> = ({
  className = 'w-8 h-8 text-ios-red',
  size = 32,
  intervalMs = 5000,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const triggerAnimation = useCallback(() => {
    setIsAnimating(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setIsAnimating(false);
    }, 650);
  }, []);

  useEffect(() => {
    // Initial welcome animation after mount
    const initialTimer = setTimeout(() => {
      triggerAnimation();
    }, 600);

    const interval = setInterval(() => {
      triggerAnimation();
    }, intervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [triggerAnimation, intervalMs]);

  const handleClick = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch (_) {}
    triggerAnimation();
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={triggerAnimation}
      className={clsx(
        'cursor-pointer select-none inline-flex items-center justify-center transition-transform active:scale-90',
        className
      )}
      style={{ width: size, height: size }}
      title="Вчасно"
      role="button"
      tabIndex={0}
      aria-label="Вчасно"
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top button stem and rounded button cap (from reference image) */}
        <line x1="12" y1="5.5" x2="12" y2="3.2" strokeWidth="2" strokeLinecap="round" />
        <line x1="9.5" y1="2.2" x2="14.5" y2="2.2" strokeWidth="2.5" strokeLinecap="round" />

        {/* Left ear/bell dome (seamlessly attached to circle without any gap) */}
        <path
          d="M 5.1 9.0 A 2.6 2.6 0 0 1 8.0 6.1 A 8 8 0 0 0 5.1 9.0 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Right ear/bell dome (seamlessly attached to circle without any gap) */}
        <path
          d="M 16.0 6.1 A 2.6 2.6 0 0 1 18.9 9.0 A 8 8 0 0 0 16.0 6.1 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Main circular clock face */}
        <circle cx="12" cy="13" r="8" strokeWidth="2" />

        {/* Minute Hand: rotates 360 degrees (from lucide-animated clock) */}
        <line
          x1="12"
          y1="13"
          x2="12"
          y2="7.5"
          strokeWidth="2"
          className={clsx(
            'text-ios-text',
            isAnimating && 'animate-clock-minute'
          )}
          style={{
            transformOrigin: '12px 13px',
            transformBox: 'view-box',
          }}
        />

        {/* Hour Hand: wiggles 40 degrees (from lucide-animated clock) */}
        <line
          x1="12"
          y1="13"
          x2="15.8"
          y2="13"
          strokeWidth="2"
          className={clsx(
            'text-ios-text',
            isAnimating && 'animate-clock-hour'
          )}
          style={{
            transformOrigin: '12px 13px',
            transformBox: 'view-box',
          }}
        />

        {/* Central pin dot (compact delicate size) */}
        <circle cx="12" cy="13" r="0.55" fill="currentColor" className="text-ios-text" />
      </svg>
    </div>
  );
};
