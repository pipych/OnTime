import React, { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';

export { AnimatedClockPeriodic } from './AnimatedClockPeriodic';

interface AnimatedClockProps {
  className?: string;
  size?: number;
  /** Seconds per full revolution of the main hand (default 12s for a distinct, lively 30° tick every second) */
  revolutionSeconds?: number;
}

/**
 * Animated Alarm Clock Icon (Continuous Ticking Version)
 * - Clock hands tick endlessly in a circle every single second
 * - Minute hand advances with a realistic mechanical spring snap
 * - Hour hand advances synchronously in a circle
 * - Retains original alarm clock bell dome styling & center pin
 * - Tap / click triggers a fast 360° celebratory spin with haptics
 */
export const AnimatedClock: React.FC<AnimatedClockProps> = ({
  className = 'w-8 h-8 text-ios-red',
  size = 32,
  revolutionSeconds = 12,
}) => {
  const [tick, setTick] = useState(0);
  const [bonusRotation, setBonusRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClick = useCallback(() => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
    } catch (_) {}

    setIsSpinning(true);
    setBonusRotation((prev) => prev + 360);
    setTimeout(() => {
      setIsSpinning(false);
    }, 650);
  }, []);

  // Minute hand: 360° / revolutionSeconds per tick (30° per second for 12s)
  const minuteAngle = tick * (360 / revolutionSeconds) + bonusRotation;

  // Hour hand: 1/12th speed of the minute hand (2.5° per second, full revolution in 144s)
  const hourAngle = tick * (360 / (revolutionSeconds * 12)) + bonusRotation / 12;

  const handTransition = isSpinning
    ? 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
    : 'transform 0.18s cubic-bezier(0.2, 1.4, 0.4, 1)';

  return (
    <div
      onClick={handleClick}
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
        {/* Top button stem and rounded button cap */}
        <line x1="12" y1="5" x2="12" y2="3.2" strokeWidth="2" />
        <line x1="9.5" y1="2.2" x2="14.5" y2="2.2" strokeWidth="2.5" />

        {/* Left ear/bell dome */}
        <path d="M3.8 8.8 A 3.5 3.5 0 0 1 8.2 5" strokeWidth="2" />

        {/* Right ear/bell dome */}
        <path d="M15.8 5 A 3.5 3.5 0 0 1 20.2 8.8" strokeWidth="2" />

        {/* Main circular clock face with solid white background */}
        <circle cx="12" cy="13" r="8" strokeWidth="2" fill="#FFFFFF" />

        {/* Minute Hand: ticks forward in a circle every second (always black) */}
        <line
          x1="12"
          y1="13"
          x2="12"
          y2="7.5"
          strokeWidth="2"
          stroke="#000000"
          style={{
            transform: `rotate(${minuteAngle}deg)`,
            transformOrigin: '12px 13px',
            transformBox: 'view-box',
            transition: handTransition,
          }}
        />

        {/* Hour Hand: ticks forward in a circle synchronously (always black) */}
        <line
          x1="12"
          y1="13"
          x2="15.8"
          y2="13"
          strokeWidth="2"
          stroke="#000000"
          style={{
            transform: `rotate(${hourAngle}deg)`,
            transformOrigin: '12px 13px',
            transformBox: 'view-box',
            transition: handTransition,
          }}
        />

        {/* Central pin dot (always black) */}
        <circle cx="12" cy="13" r="1.1" fill="#000000" />
      </svg>
    </div>
  );
};

