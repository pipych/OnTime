import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { DayInfo, DeviceKey } from '../types';
import { getDaysForWeek, getWeekId, getWeekRangeStr, formatISODate } from '../utils/date';
import { WeekStrip } from '../components/WeekStrip';
import { DeviceChecklist } from '../components/DeviceChecklist';
import { SFSymbol } from '../components/SFSymbol';
import { CHARGE_DAYS_MAP } from '../constants/devices';
import {
  fetchChargesFromGAS,
  toggleChargeGAS,
  chargeAllGAS,
  getLocalCharges,
  getGasApiUrl,
  setGasApiUrl,
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
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [gasUrlInput, setGasUrlInput] = useState<string>(() => getGasApiUrl());
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
  }, [loadCharges]);

  // Toggle single device
  const handleToggleDevice = (deviceKey: DeviceKey) => {
    onHapticImpact?.('medium');
    const fullKey = `CHG_${currentWeekId}_${deviceKey}`;
    const newStatus = !charges[fullKey];

    // Optimistic UI
    setCharges((prev) => ({
      ...prev,
      [fullKey]: newStatus,
    }));

    if (newStatus) {
      onHapticSuccess?.();
    }

    // Sync to GAS & localStorage
    toggleChargeGAS(currentWeekId, deviceKey, newStatus);
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

    chargeAllGAS(currentWeekId, items);
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

  const handleSaveGasUrl = () => {
    setGasApiUrl(gasUrlInput);
    setShowSettingsModal(false);
    loadCharges();
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 pt-3 pb-36 space-y-4 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[30px] font-bold text-ios-text tracking-tight">
            Зарядки
          </h1>
          <span
            className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
              syncStatus === 'synced' ? 'bg-ios-green' : 'bg-ios-accent'
            }`}
            title={syncStatus === 'synced' ? 'Синхронизировано' : 'Локальный режим'}
          />
        </div>

        {/* Sync / Settings button */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadCharges}
            disabled={isLoading}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-ios-card border border-ios-border text-ios-textSecondary hover:text-ios-text active:scale-95 transition-all shadow-sm"
            title="Обновить данные"
            aria-label="Обновить данные"
          >
            <SFSymbol
              src="/symbols/SVG_Vector/08_schedule_calendar_clock.svg"
              className={`w-6 h-6 ${isLoading ? 'animate-spin text-ios-accent' : ''}`}
            />
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-ios-card border border-ios-border text-ios-textSecondary hover:text-ios-text active:scale-95 transition-all shadow-sm"
            title="Настройки подключения"
            aria-label="Настройки подключения"
          >
            <SFSymbol
              src="/symbols/SVG_Vector/11_settings_gear.svg"
              className="w-6 h-6"
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
        onToday={handleToday}
        weekRangeStr={weekRangeStr}
        slideDirection={slideDirection}
      />

      {/* Device Checklist for Selected Day */}
      <DeviceChecklist
        day={selectedDay}
        charges={charges}
        onToggleDevice={handleToggleDevice}
        onChargeAll={handleChargeAll}
        sundayUnchargedItems={sundayUnchargedItems}
      />

      {/* Settings Modal (GAS URL Configuration) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-5 rounded-ios-lg bg-ios-card border border-ios-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-ios-text">
                Подключение к боту
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-ios-item-bg text-ios-textSecondary hover:text-ios-text active:scale-95 transition-all"
              >
                <SFSymbol
                  src="/symbols/SVG_Vector/12_close_xmark.svg"
                  className="w-5 h-5"
                />
              </button>
            </div>

            <p className="text-[13px] text-ios-textSecondary leading-relaxed">
              Укажите URL опубликованного веб-приложения Google Apps Script бота (Web App URL).
              Все отметки будут синхронизироваться в реальном времени с ботом.
            </p>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-ios-textSecondary block">
                Google Apps Script Web App URL:
              </label>
              <input
                type="url"
                value={gasUrlInput}
                onChange={(e) => setGasUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full p-3 rounded-ios-sm bg-ios-cardSubtle border border-ios-border text-ios-text text-[13px] outline-none focus:border-ios-accent transition-colors"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2.5 rounded-full text-ios-textSecondary font-medium text-[14px] hover:text-ios-text"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveGasUrl}
                className="px-5 py-2.5 rounded-full bg-ios-accent text-white font-semibold text-[14px] shadow-glow-accent active:scale-95 transition-all"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
