import React, { useState, useEffect, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import type { DayInfo, DeviceKey } from '../types';
import { getDaysForWeek, getWeekId, getWeekRangeStr, formatISODate } from '../utils/date';
import { WeekStrip } from '../components/WeekStrip';
import { DeviceChecklist } from '../components/DeviceChecklist';
import { CHARGE_DAYS_MAP } from '../constants/devices';
import {
  fetchChargesFromGAS,
  toggleChargeGAS,
  chargeAllGAS,
  getLocalCharges,
  getGasApiUrl,
} from '../services/api';

interface SchedulePageProps {
  onHapticImpact?: (style?: 'light' | 'medium' | 'heavy') => void;
  onHapticSuccess?: () => void;
  onHapticSelection?: () => void;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({
  onHapticImpact,
  onHapticSuccess,
  onHapticSelection,
}) => {
  // Current active date reference
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());
  
  // Selected day ISO string (e.g. "2026-09-04")
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>(() =>
    formatISODate(new Date())
  );

  // Charges map: { "CHG_2026_W36_ITEM_TWS": true, ... }
  const [charges, setCharges] = useState<Record<string, boolean>>(() =>
    getLocalCharges(getWeekId(new Date()))
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local' | 'error'>('synced');

  // Days list for the current week
  const weekDays = useMemo(() => {
    return getDaysForWeek(referenceDate);
  }, [referenceDate]);

  const currentWeekId = useMemo(() => {
    return getWeekId(referenceDate);
  }, [referenceDate]);

  const weekRangeStr = useMemo(() => {
    return getWeekRangeStr(referenceDate);
  }, [referenceDate]);

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

  // Load charges from cache & GAS
  const loadCharges = useCallback(async () => {
    // 1. Instant load from local cache
    const local = getLocalCharges(currentWeekId);
    setCharges(local);

    // 2. Fetch from GAS
    const gasUrl = getGasApiUrl();
    if (gasUrl) {
      setIsLoading(true);
      try {
        const gasCharges = await fetchChargesFromGAS(currentWeekId);
        setCharges(gasCharges);
        setSyncStatus('synced');
      } catch (e) {
        setSyncStatus('local');
      } finally {
        setIsLoading(false);
      }
    } else {
      setSyncStatus('local');
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
    toggleChargeGAS(currentWeekId, deviceKey, newStatus).catch(() => {});
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

    chargeAllGAS(currentWeekId, items).catch(() => {});
  };

  // Week slide animation direction
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  // Navigation handlers
  const handleSelectDay = (day: DayInfo) => {
    onHapticSelection?.();
    setSelectedIsoDate(day.isoDate);
  };

  const handlePrevWeek = () => {
    onHapticImpact?.('light');
    setSlideDirection('left');
    const d = new Date(referenceDate.getTime());
    d.setDate(d.getDate() - 7);
    setReferenceDate(d);
    setSelectedIsoDate(formatISODate(d));
  };

  const handleNextWeek = () => {
    onHapticImpact?.('light');
    setSlideDirection('right');
    const d = new Date(referenceDate.getTime());
    d.setDate(d.getDate() + 7);
    setReferenceDate(d);
    setSelectedIsoDate(formatISODate(d));
  };

  const handleToday = () => {
    onHapticImpact?.('medium');
    setSlideDirection(null);
    const now = new Date();
    setReferenceDate(now);
    setSelectedIsoDate(formatISODate(now));
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 pt-3 pb-36 space-y-4 animate-fadeIn">
      {/* Top Header: Date Number + Red Short Day of Week */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[38px] font-extrabold text-ios-text tracking-tight leading-none">
            {selectedDay.dayOfMonth}
          </span>
          <span className="text-[26px] font-bold text-ios-red tracking-tight leading-none">
            {selectedDay.shortName}
          </span>
          <span
            className={clsx(
              'w-2 h-2 rounded-full mb-1 transition-all',
              isLoading
                ? 'bg-ios-red animate-pulse'
                : syncStatus === 'synced'
                ? 'bg-ios-green'
                : 'bg-ios-red'
            )}
            title={isLoading ? 'Синхронизация...' : syncStatus === 'synced' ? 'Синхронизировано' : 'Локальный режим'}
          />
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
        onToday={handleToday}
        weekRangeStr={weekRangeStr}
        slideDirection={slideDirection}
      />

      {/* Progress bar directly under the calendar, without card or percentages */}
      {selectedTotalCount > 0 && (
        <div className="w-full px-1 -mt-1 mb-1">
          <div className="w-full h-1.5 rounded-full bg-ios-card border border-ios-border/80 overflow-hidden">
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
        onToggleDevice={handleToggleDevice}
        onChargeAll={handleChargeAll}
        sundayUnchargedItems={sundayUnchargedItems}
      />
    </div>
  );
};
