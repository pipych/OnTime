import React from 'react';
import clsx from 'clsx';
import type { DayInfo } from '../types';
import { SFSymbol } from './SFSymbol';

interface WeekStripProps {
  days: DayInfo[];
  selectedDate: string; // isoDate
  onSelectDay: (day: DayInfo) => void;
  charges: Record<string, boolean>;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  onToday?: () => void;
  weekRangeStr: string;
}

export const WeekStrip: React.FC<WeekStripProps> = ({
  days,
  selectedDate,
  onSelectDay,
  charges,
  onPrevWeek,
  onNextWeek,
  onToday,
  weekRangeStr,
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
        onNextWeek?.();
      } else {
        onPrevWeek?.();
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
      className="w-full mb-5 select-none touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header bar: Week Range & Navigation */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <span className="text-[14px] font-semibold tracking-tight text-ios-text">
            {weekRangeStr}
          </span>
          {onToday && (
            <button
              onClick={onToday}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-ios-accent/15 text-ios-accent hover:bg-ios-accent/25 active:scale-95 transition-all"
            >
              Сегодня
            </button>
          )}
        </div>

        {/* Prev / Next week arrows */}
        {(onPrevWeek || onNextWeek) && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onPrevWeek}
              className="w-9 h-9 rounded-full flex items-center justify-center text-ios-textSecondary hover:text-ios-text bg-ios-card border border-ios-border active:scale-90 transition-all shadow-sm"
              aria-label="Предыдущая неделя"
            >
              <SFSymbol
                src="/symbols/SVG_Vector/15_back_chevron.svg"
                className="w-4.5 h-4.5"
              />
            </button>
            <button
              onClick={onNextWeek}
              className="w-9 h-9 rounded-full flex items-center justify-center text-ios-textSecondary hover:text-ios-text bg-ios-card border border-ios-border active:scale-90 transition-all shadow-sm"
              aria-label="Следующая неделя"
            >
              <SFSymbol
                src="/symbols/SVG_Vector/15_back_chevron.svg"
                className="w-4.5 h-4.5 rotate-180"
              />
            </button>
          </div>
        )}
      </div>

      {/* Days Horizontal Strip with ample padding so shadows/glow don't clip */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-3 px-1 -my-1">
        {days.map((day) => {
          const isSelected = day.isoDate === selectedDate;
          const status = getDayStatus(day);

          return (
            <button
              key={day.isoDate}
              onClick={() => onSelectDay(day)}
              className={clsx(
                'flex-1 min-w-[42px] max-w-[56px] py-2.5 px-1 rounded-[18px] flex flex-col items-center justify-between transition-all duration-200 ease-out relative',
                isSelected
                  ? 'bg-ios-accent text-white shadow-glow-accent scale-[1.04] z-10'
                  : 'bg-ios-card border border-ios-border text-ios-text hover:border-ios-accent/40 active:scale-95'
              )}
            >
              {/* Day of Week Name */}
              <span
                className={clsx(
                  'text-[12px] font-medium tracking-tight mb-1',
                  isSelected
                    ? 'text-white/90 font-semibold'
                    : day.isToday
                    ? 'text-ios-accent font-semibold'
                    : 'text-ios-textSecondary'
                )}
              >
                {day.shortName}
              </span>

              {/* Day Number */}
              <span
                className={clsx(
                  'text-[17px] font-bold leading-none my-0.5 tracking-tight',
                  isSelected
                    ? 'text-white'
                    : day.isToday
                    ? 'text-ios-accent'
                    : 'text-ios-text'
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
                {status === 'pending' && (
                  <span
                    className={clsx(
                      'w-1 h-1 rounded-full',
                      isSelected ? 'bg-white/40' : 'bg-ios-textSecondary/30'
                    )}
                  />
                )}
              </div>

              {/* Today marker pill top-badge */}
              {day.isToday && !isSelected && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-ios-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
