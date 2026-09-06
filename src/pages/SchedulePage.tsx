import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import clsx from 'clsx';
import type { DayInfo, DeviceKey } from '../types';
import {
  getDaysForWeek,
  getWeekId,
  formatISODate,
  canNavigatePrevWeek,
  canNavigateNextWeek,
} from '../utils/date';
import { WeekStrip } from '../components/WeekStrip';
import { DeviceChecklist } from '../components/DeviceChecklist';
import { SFSymbol } from '../components/SFSymbol';
import { CHARGE_DAYS_MAP } from '../constants/devices';
import { useI18n } from '../context/I18nContext';
import {
  fetchWeeklyDataFromGAS,
  toggleChargeGAS,
  chargeAllGAS,
  getLocalCharges,
  getLocalSchedule,
  getGasApiUrl,
} from '../services/api';

interface SchedulePageProps {
  userId?: number | string;
  userName?: string;
  onHapticImpact?: (style?: 'light' | 'medium' | 'heavy') => void;
  onHapticSuccess?: () => void;
  onHapticSelection?: () => void;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({
  userId,
  userName,
  onHapticImpact,
  onHapticSuccess,
  onHapticSelection,
}) => {
  const { lang, t } = useI18n();

  // Current active date reference
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());
  
  // Selected day ISO string (e.g. "2026-09-04")
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>(() =>
    formatISODate(new Date())
  );

  // Charges map: accumulates charges for all loaded weeks
  const [charges, setCharges] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const now = new Date();
    for (let offset = -2; offset <= 1; offset++) {
      const d = new Date(now.getTime() + offset * 7 * 86400000);
      const wId = getWeekId(d);
      const cached = getLocalCharges(wId);
      Object.assign(initial, cached);
    }
    return initial;
  });

  // Schedules map: accumulates schedules for loaded weeks
  const [schedules, setSchedules] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {};
    const now = new Date();
    for (let offset = -2; offset <= 1; offset++) {
      const d = new Date(now.getTime() + offset * 7 * 86400000);
      const wId = getWeekId(d);
      const cached = getLocalSchedule(wId);
      if (cached) {
        initial[wId] = cached;
      }
    }
    return initial;
  });

  // Days list for the current week (localized)
  const weekDays = useMemo(() => {
    return getDaysForWeek(referenceDate, lang);
  }, [referenceDate, lang]);

  const currentWeekId = useMemo(() => {
    return getWeekId(referenceDate);
  }, [referenceDate]);

  // Today's date reference for header display (strictly today's calendar date, localized)
  const now = new Date();
  const todayDayNumber = now.getDate();
  const todayShortName = t.daysShort[now.getDay()];

  // Allowed navigation bounds (-2 past weeks, +1 future week)
  const canPrev = useMemo(() => canNavigatePrevWeek(referenceDate), [referenceDate]);
  const canNext = useMemo(() => canNavigateNextWeek(referenceDate), [referenceDate]);

  // The currently selected day object
  const selectedDay = useMemo(() => {
    const found = weekDays.find((d) => d.isoDate === selectedIsoDate);
    return found || weekDays[0];
  }, [weekDays, selectedIsoDate]);

  // Calculate Sunday debt: any devices from Mon-Sat that are uncharged
  const sundayUnchargedItems = useMemo(() => {
    const uncharged: DeviceKey[] = [];
    for (let day = 1; day <= 6; day++) {
      const items = CHARGE_DAYS_MAP[day] || [];
      for (const item of items) {
        if (!charges[`CHG_${currentWeekId}_${item}`] && !uncharged.includes(item)) {
          uncharged.push(item);
        }
      }
    }
    return uncharged;
  }, [charges, currentWeekId]);

  // Statistics for selected day (for progress bar under calendar)
  const selectedDayItems = useMemo(() => {
    const isSunday = selectedDay.dayOfWeek === 0;
    const items: DeviceKey[] = [...selectedDay.deviceKeys];
    if (isSunday && sundayUnchargedItems.length > 0) {
      sundayUnchargedItems.forEach((k) => {
        if (!items.includes(k)) items.push(k);
      });
    }
    return items;
  }, [selectedDay, sundayUnchargedItems]);

  const selectedTotalCount = selectedDayItems.length;
  const selectedChargedCount = selectedDayItems.filter(
    (k) => charges[`CHG_${currentWeekId}_${k}`]
  ).length;
  const isSelectedAllCharged = selectedTotalCount > 0 && selectedChargedCount === selectedTotalCount;
  const selectedPercent = selectedTotalCount > 0
    ? Math.round((selectedChargedCount / selectedTotalCount) * 100)
    : 0;

  const activeWeekRef = useRef<string>(currentWeekId);
  activeWeekRef.current = currentWeekId;

  // Load charges & schedule from cache & GAS
  const loadCharges = useCallback(async () => {
    const targetWeek = currentWeekId;

    // 1. Instant load from local cache without destroying other weeks
    const local = getLocalCharges(targetWeek);
    if (Object.keys(local).length > 0) {
      setCharges((prev) => ({ ...prev, ...local }));
    }
    const cachedSched = getLocalSchedule(targetWeek);
    if (cachedSched) {
      setSchedules((prev) => ({ ...prev, [targetWeek]: cachedSched }));
    }

    // 2. Fetch from GAS
    const gasUrl = getGasApiUrl();
    if (gasUrl) {
      try {
        const result = await fetchWeeklyDataFromGAS(targetWeek);
        if (activeWeekRef.current === targetWeek) {
          if (result.charges) {
            setCharges((prev) => {
              const updated = { ...prev };
              // Clean uncharged keys for targetWeek that are no longer true
              for (const k in updated) {
                if (k.startsWith(`CHG_${targetWeek}_`) && !result.charges[k]) {
                  delete updated[k];
                }
              }
              return { ...updated, ...result.charges };
            });
          }
          if (result.schedule) {
            setSchedules((prev) => ({ ...prev, [targetWeek]: result.schedule! }));
          }
        }
      } catch (e) {
        // Cached local charges and schedule remain active
      }
    }
  }, [currentWeekId]);

  useEffect(() => {
    loadCharges();

    // Auto-refresh charges whenever user returns to the app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCharges();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [loadCharges]);

  // Preload all allowed weeks (-2, -1, 0, +1) on initial mount to eliminate navigation lag
  useEffect(() => {
    const allowedOffsets = [-2, -1, 0, 1];
    const base = new Date();
    allowedOffsets.forEach(async (offset) => {
      const d = new Date(base.getTime() + offset * 7 * 86400000);
      const wId = getWeekId(d);
      if (wId !== currentWeekId) {
        try {
          const remote = await fetchWeeklyDataFromGAS(wId);
          if (remote.charges && Object.keys(remote.charges).length > 0) {
            setCharges((prev) => ({ ...prev, ...remote.charges }));
          }
          if (remote.schedule) {
            setSchedules((prev) => ({ ...prev, [wId]: remote.schedule! }));
          }
        } catch (_) {}
      }
    });
  }, []);

  // Toggle single device
  const handleToggleDevice = (deviceKey: DeviceKey) => {
    onHapticImpact?.('medium');
    const fullKey = `CHG_${currentWeekId}_${deviceKey}`;
    const newStatus = !charges[fullKey];

    // Optimistic UI with clean deletion when unchecking
    setCharges((prev) => {
      const updated = { ...prev };
      if (newStatus) {
        updated[fullKey] = true;
      } else {
        delete updated[fullKey];
      }
      return updated;
    });

    if (newStatus) {
      onHapticSuccess?.();
    }

    // Sync to GAS & localStorage in background
    toggleChargeGAS(currentWeekId, deviceKey, newStatus, userId, userName).catch(() => {});
  };

  // Charge all items for current day
  const handleChargeAll = () => {
    onHapticSuccess?.();
    const items = selectedDay.dayOfWeek === 0
      ? [...selectedDay.deviceKeys, ...sundayUnchargedItems]
      : selectedDay.deviceKeys;

    setCharges((prev) => {
      const updated = { ...prev };
      items.forEach((k) => {
        updated[`CHG_${currentWeekId}_${k}`] = true;
      });
      return updated;
    });

    chargeAllGAS(currentWeekId, items, userId, userName).catch(() => {});
  };

  // Week slide animation direction
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  // Navigation handlers
  const handleSelectDay = (day: DayInfo) => {
    onHapticSelection?.();
    setSelectedIsoDate(day.isoDate);
  };

  const handlePrevWeek = () => {
    if (!canPrev) return;
    onHapticImpact?.('light');
    setSlideDirection('left');
    const d = new Date(referenceDate.getTime());
    d.setDate(d.getDate() - 7);
    setReferenceDate(d);
    setSelectedIsoDate(formatISODate(d));
  };

  const handleNextWeek = () => {
    if (!canNext) return;
    onHapticImpact?.('light');
    setSlideDirection('right');
    const d = new Date(referenceDate.getTime());
    d.setDate(d.getDate() + 7);
    setReferenceDate(d);
    setSelectedIsoDate(formatISODate(d));
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 pt-3 pb-36 space-y-4 animate-fadeIn">
      {/* Top Header: Today's Date Number + Red Short Day of Week + Week Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[54px] font-black text-ios-text tracking-tight leading-none">
            {todayDayNumber}
          </span>
          <span className="text-[26px] font-bold text-ios-red tracking-tight leading-none">
            {todayShortName}
          </span>
        </div>

        {/* Week navigation buttons on the same row as header */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevWeek}
            disabled={!canPrev}
            className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center bg-ios-card transition-all shadow-sm",
              canPrev
                ? "text-ios-textSecondary hover:text-ios-text active:scale-90"
                : "opacity-25 pointer-events-none cursor-not-allowed"
            )}
            aria-label={t.prevWeek}
          >
            <SFSymbol
              src="/symbols/SVG_Vector/15_back_chevron.svg"
              className="w-5 h-5"
            />
          </button>
          <button
            onClick={handleNextWeek}
            disabled={!canNext}
            className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center bg-ios-card transition-all shadow-sm",
              canNext
                ? "text-ios-textSecondary hover:text-ios-text active:scale-90"
                : "opacity-25 pointer-events-none cursor-not-allowed"
            )}
            aria-label={t.nextWeek}
          >
            <SFSymbol
              src="/symbols/SVG_Vector/15_back_chevron.svg"
              className="w-5 h-5 rotate-180"
            />
          </button>
        </div>
      </div>

      {/* Week Strip Horizontal Calendar */}
      <WeekStrip
        days={weekDays}
        selectedDate={selectedIsoDate}
        onSelectDay={handleSelectDay}
        charges={charges}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        canPrev={canPrev}
        canNext={canNext}
        slideDirection={slideDirection}
      />

      {/* Progress bar directly under the calendar, without card or percentages, and without border */}
      {selectedTotalCount > 0 && (
        <div className="w-full px-1 -mt-1 mb-1">
          <div className="w-full h-1.5 rounded-full bg-ios-progressTrack overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-300 ease-out',
                isSelectedAllCharged ? 'bg-ios-green' : 'bg-ios-red'
              )}
              style={{ width: `${selectedPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Device Checklist for Selected Day */}
      <DeviceChecklist
        day={selectedDay}
        charges={charges}
        schedule={schedules[currentWeekId]}
        onToggleDevice={handleToggleDevice}
        onChargeAll={handleChargeAll}
        sundayUnchargedItems={sundayUnchargedItems}
      />
    </div>
  );
};
