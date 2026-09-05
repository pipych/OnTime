import React from 'react';
import clsx from 'clsx';
import type { DayInfo } from '../types';

interface WeekStripProps {
  days: DayInfo[];
  selectedDate: string; // isoDate
  onSelectDay: (day: DayInfo) => void;
  charges: Record<string, boolean>;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  onToday?: () => void;
  weekRangeStr?: string;
  slideDirection?: 'left' | 'right' | null;
}

export const WeekStrip: React.FC<WeekStripProps> = ({
  days,
  selectedDate,
  onSelectDay,
  charges,
  onPrevWeek,
  onNextWeek,
  canPrev = true,
  canNext = true,
  slideDirection = null,
}) => {
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);
  const [touchStartY, setTouchStartY] = React.useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Minimum swipe threshold of 40px and predominantly horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        if (canNext) onNextWeek?.();
      } else {
        if (canPrev) onPrevWeek?.();
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  /**
   * Calculate day completion status
   */
  const getDayStatus = (day: DayInfo) => {
    const items = day.deviceKeys;
    if (!items || items.length === 0) return 'none';

    let chargedCount = 0;
    for (const key of items) {
      if (charges[`CHG_${day.weekId}_${key}`]) {
        chargedCount++;
      }
    }

    if (chargedCount === items.length) return 'complete'; // all charged
    if (chargedCount > 0) return 'partial'; // partially charged
    return 'pending'; // 0 charged
  };

  return (
    <div
      className="w-full mb-3 select-none touch-pan-y overflow-visible"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Days Strip with animated slide and unclipped overflow */}
      <div
        key={days[0]?.isoDate}
        className={clsx(
          'grid grid-cols-7 gap-1.5 py-3 px-0.5 overflow-visible transition-all duration-300',
          slideDirection === 'right' && 'animate-slide-right',
          slideDirection === 'left' && 'animate-slide-left'
        )}
      >
        {days.map((day) => {
          const isSelected = day.isoDate === selectedDate;
          const status = getDayStatus(day);

          return (
            <button
              key={day.isoDate}
              onClick={() => onSelectDay(day)}
              className={clsx(
                'w-full py-2.5 px-0.5 rounded-[18px] flex flex-col items-center justify-between transition-all duration-200 ease-out relative',
                isSelected
                  ? 'bg-ios-red text-white shadow-glow-red scale-[1.04] z-10'
                  : 'bg-ios-card active:scale-95'
              )}
            >
              {/* Day of Week Name: white if selected, red if unselected */}
              <span
                className={clsx(
                  'text-[12px] font-semibold tracking-tight mb-1',
                  isSelected ? 'text-white' : 'text-ios-red'
                )}
              >
                {day.shortName}
              </span>

              {/* Day Number: white if selected, adaptive text-ios-text if unselected */}
              <span
                className={clsx(
                  'text-[17px] font-bold leading-none my-0.5 tracking-tight transition-colors',
                  isSelected ? 'text-white' : 'text-ios-text'
                )}
              >
                {day.dayOfMonth}
              </span>

              {/* Status Dot / Indicator */}
              <div className="h-2 flex items-center justify-center mt-1">
                {status === 'complete' && (
                  <span
                    className={clsx(
                      'w-1.5 h-1.5 rounded-full',
                      isSelected ? 'bg-white' : 'bg-ios-green'
                    )}
                  />
                )}
                {status === 'partial' && (
                  <span
                    className={clsx(
                      'w-1.5 h-1.5 rounded-full',
                      isSelected ? 'bg-white' : 'bg-ios-orange'
                    )}
                  />
                )}
                {(status === 'pending' || status === 'none') && (
                  <span
                    className={clsx(
                      'w-1.5 h-1.5 rounded-full transition-colors',
                      isSelected ? 'bg-white/50' : 'bg-black/30 dark:bg-white/30'
                    )}
                  />
                )}
              </div>

              {/* Today marker pill top-badge */}
              {day.isToday && !isSelected && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-ios-red" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
