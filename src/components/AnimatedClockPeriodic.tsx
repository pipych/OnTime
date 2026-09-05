import React, { useState, useEffect, useCallback, useRef } from 'react';
import clsx from 'clsx';

interface AnimatedClockPeriodicProps {
  className?: string;
  size?: number;
  intervalMs?: number;
}

/**
 * Animated Alarm Clock Icon (Original 5-second periodic version)
 * - Plays hands rotation animation every 5 seconds (matching lucide-animated/icons/clock)
 * - Includes top bells and button cap details inspired by the OnTime 3D app icon reference
 * - Interactive: re-triggers on click/hover with haptic feedback
 */
export const AnimatedClockPeriodic: React.FC<AnimatedClockPeriodicProps> = ({
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
        <line x1="12" y1="5" x2="12" y2="3.2" strokeWidth="2" />
        <line x1="9.5" y1="2.2" x2="14.5" y2="2.2" strokeWidth="2.5" />

        {/* Left ear/bell dome (from reference image) */}
        <path d="M3.8 8.8 A 3.5 3.5 0 0 1 8.2 5" strokeWidth="2" />

        {/* Right ear/bell dome (from reference image) */}
        <path d="M15.8 5 A 3.5 3.5 0 0 1 20.2 8.8" strokeWidth="2" />

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

        {/* Central pin dot */}
        <circle cx="12" cy="13" r="1.1" fill="currentColor" className="text-ios-text" />
      </svg>
    </div>
  );
};
