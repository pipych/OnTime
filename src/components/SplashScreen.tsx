import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

interface SplashScreenProps {
  isDataReady: boolean;
  onFinished?: () => void;
  size?: number;
}

/**
 * Splash Screen
 * - Clean fullscreen view matching the active theme background
 * - Centered enlarged alarm clock icon (preserved 5s periodic version design)
 * - Plays full animation cycles (1 second per cycle)
 * - If data loads before animation finishes, animation is NEVER interrupted
 * - Screen dismisses only upon completion of a full animation cycle
 * - Very smooth fade-out / zoom transition into the app
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({
  isDataReady,
  onFinished,
  size = 140,
}) => {
  const [isDismissing, setIsDismissing] = useState(false);
  const [isUnmounted, setIsUnmounted] = useState(false);

  const dataReadyRef = useRef(isDataReady);
  dataReadyRef.current = isDataReady;

  const isDismissingRef = useRef(false);

  const CYCLE_MS = 1000;

  useEffect(() => {
    let timeoutId: number;

    const onCycleEnd = () => {
      if (isDismissingRef.current) return;

      if (dataReadyRef.current) {
        // Full animation cycle completed AND data is ready!
        isDismissingRef.current = true;
        setIsDismissing(true);
        setTimeout(() => {
          setIsUnmounted(true);
          onFinished?.();
        }, 700);
      } else {
        // Data not ready yet, queue the next full animation cycle
        timeoutId = window.setTimeout(onCycleEnd, CYCLE_MS);
      }
    };

    // First cycle runs for full CYCLE_MS
    timeoutId = window.setTimeout(onCycleEnd, CYCLE_MS);

    return () => clearTimeout(timeoutId);
  }, [onFinished]);

  if (isUnmounted) return null;

  return (
    <div
      className={clsx(
        'fixed inset-0 z-[9999] flex items-center justify-center bg-ios-bg select-none transition-all duration-700 ease-in-out',
        isDismissing ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
      )}
      aria-hidden={isDismissing}
    >
      <div className="flex items-center justify-center">
        <div
          className="text-ios-red inline-flex items-center justify-center transition-transform duration-700"
          style={{ width: size, height: size }}
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

            {/* Main circular clock face */}
            <circle cx="12" cy="13" r="8" strokeWidth="2" />

            {/* Minute Hand: 360 degree spin */}
            <line
              x1="12"
              y1="13"
              x2="12"
              y2="7.5"
              strokeWidth="2"
              className="text-ios-text animate-splash-minute"
              style={{
                transformOrigin: '12px 13px',
                transformBox: 'view-box',
              }}
            />

            {/* Hour Hand: 40 degree wiggle */}
            <line
              x1="12"
              y1="13"
              x2="15.8"
              y2="13"
              strokeWidth="2"
              className="text-ios-text animate-splash-hour"
              style={{
                transformOrigin: '12px 13px',
                transformBox: 'view-box',
              }}
            />

            {/* Central pin dot */}
            <circle cx="12" cy="13" r="1.1" fill="currentColor" className="text-ios-text" />
          </svg>
        </div>
      </div>
    </div>
  );
};
