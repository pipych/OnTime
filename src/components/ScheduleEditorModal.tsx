import React, { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import {
  getDaysForWeek,
  getWeekId,
  getWeekRangeStr,
  getWeekOffset,
} from '../utils/date';
import { SFSymbol } from './SFSymbol';
import { useI18n } from '../context/I18nContext';
import {
  saveScheduleGAS,
  getLocalSchedule,
  fetchWeeklyDataFromGAS,
} from '../services/api';

interface ScheduleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeekSchedule?: Record<string, string> | null;
  userId?: number | string;
  userName?: string;
  onSaved?: (weekId: string, schedule: Record<string, string>) => void;
  onHapticImpact?: (style?: 'light' | 'medium' | 'heavy') => void;
  onHapticSuccess?: () => void;
}

const DAY_KEYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

export const ScheduleEditorModal: React.FC<ScheduleEditorModalProps> = ({
  isOpen,
  onClose,
  currentWeekSchedule,
  userId,
  userName,
  onSaved,
  onHapticImpact,
  onHapticSuccess,
}) => {
  const { lang, t } = useI18n();

  // Reference date for target week: default to next week (+7 days from now)
  const [targetDate, setTargetDate] = useState<Date>(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  });

  const baseToday = useMemo(() => new Date(), []);

  // Target week offset from current week (0 = current week, 1 = next week, etc.)
  const targetOffset = useMemo(() => {
    return getWeekOffset(targetDate, baseToday);
  }, [targetDate, baseToday]);

  // Can only navigate forward: offset cannot be < 0
  const canPrev = targetOffset > 0;
  const canNext = targetOffset < 4; // up to 4 weeks ahead

  const targetWeekId = useMemo(() => {
    return getWeekId(targetDate);
  }, [targetDate]);

  // Days list for target week
  const weekDays = useMemo(() => {
    return getDaysForWeek(targetDate, lang);
  }, [targetDate, lang]);

  // Target week header string (e.g. "14.09 — 20.09")
  const [startStr, endStr] = useMemo(() => {
    const range = getWeekRangeStr(targetDate);
    const parts = range.split(' — ');
    return [parts[0] || '', parts[1] || ''];
  }, [targetDate]);

  // Local shifts state: Record<dayKey, employeeName>
  const [shifts, setShifts] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedSwapDay, setSelectedSwapDay] = useState<string | null>(null);
  const [draggedDay, setDraggedDay] = useState<string | null>(null);

  // Initialize or update shifts when target week changes
  useEffect(() => {
    if (!isOpen) return;

    // 1. Check if target week already has saved schedule
    const existing = getLocalSchedule(targetWeekId);
    if (existing && Object.keys(existing).length > 0) {
      setShifts({ ...existing });
      return;
    }

    // 2. Fetch from GAS if available
    fetchWeeklyDataFromGAS(targetWeekId)
      .then((res) => {
        if (res.schedule && Object.keys(res.schedule).length > 0) {
          setShifts({ ...res.schedule });
        } else if (currentWeekSchedule && Object.keys(currentWeekSchedule).length > 0) {
          // Pre-fill from current week template
          setShifts({ ...currentWeekSchedule });
        } else {
          setShifts({});
        }
      })
      .catch(() => {
        if (currentWeekSchedule) {
          setShifts({ ...currentWeekSchedule });
        }
      });
  }, [isOpen, targetWeekId, currentWeekSchedule]);

  // Reset to current week's template
  const handleResetToTemplate = () => {
    onHapticImpact?.('medium');
    if (currentWeekSchedule) {
      setShifts({ ...currentWeekSchedule });
    }
  };

  // Week navigation
  const handlePrevWeek = () => {
    if (!canPrev) return;
    onHapticImpact?.('light');
    setSelectedSwapDay(null);
    const d = new Date(targetDate.getTime());
    d.setDate(d.getDate() - 7);
    setTargetDate(d);
  };

  const handleNextWeek = () => {
    if (!canNext) return;
    onHapticImpact?.('light');
    setSelectedSwapDay(null);
    const d = new Date(targetDate.getTime());
    d.setDate(d.getDate() + 7);
    setTargetDate(d);
  };

  // Text change for a day
  const handleShiftChange = (dayKey: string, value: string) => {
    setShifts((prev) => ({
      ...prev,
      [dayKey]: value,
    }));
  };

  // Clear shift for a day (set to day off)
  const handleClearDay = (dayKey: string) => {
    onHapticImpact?.('light');
    setShifts((prev) => ({
      ...prev,
      [dayKey]: '',
    }));
  };

  // Swap shifts between dayKeyA and dayKeyB
  const swapShifts = (dayA: string, dayB: string) => {
    if (dayA === dayB) return;
    onHapticImpact?.('medium');
    setShifts((prev) => {
      const valA = prev[dayA] || '';
      const valB = prev[dayB] || '';
      return {
        ...prev,
        [dayA]: valB,
        [dayB]: valA,
      };
    });
    setSelectedSwapDay(null);
  };

  // Tap-to-swap handler
  const handleDaySelectForSwap = (dayKey: string) => {
    if (!selectedSwapDay) {
      onHapticImpact?.('light');
      setSelectedSwapDay(dayKey);
    } else if (selectedSwapDay === dayKey) {
      setSelectedSwapDay(null);
    } else {
      swapShifts(selectedSwapDay, dayKey);
    }
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, dayKey: string) => {
    setDraggedDay(dayKey);
    e.dataTransfer.setData('text/plain', dayKey);
    onHapticImpact?.('light');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDayKey: string) => {
    e.preventDefault();
    if (draggedDay && draggedDay !== targetDayKey) {
      swapShifts(draggedDay, targetDayKey);
    }
    setDraggedDay(null);
  };

  // Save schedule
  const handleSave = async () => {
    setIsSaving(true);
    onHapticImpact?.('medium');

    // Clean empty values
    const cleanSchedule: Record<string, string> = {};
    DAY_KEYS.forEach((k) => {
      if (shifts[k] && shifts[k].trim()) {
        cleanSchedule[k] = shifts[k].trim();
      }
    });

    try {
      await saveScheduleGAS(targetWeekId, cleanSchedule, userId, userName);
      onHapticSuccess?.();
      onSaved?.(targetWeekId, cleanSchedule);
      onClose();
    } catch (e) {
      console.error('Failed to save schedule:', e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ios-bg text-ios-text animate-fadeIn overflow-y-auto">
      {/* Top iOS Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-ios-bg/85 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="w-full max-w-lg mx-auto px-4 pt-[max(calc(env(safe-area-inset-top,0px)+12px),16px)] pb-3.5 flex items-center justify-between">
          {/* Cancel button */}
          <button
            type="button"
            onClick={() => {
              onHapticImpact?.('light');
              onClose();
            }}
            className="text-[17px] text-ios-accent active:opacity-60 transition-opacity font-normal"
          >
            {t.cancelBtn}
          </button>

          {/* Centered Modal Title */}
          <h2 className="text-[17px] font-semibold text-ios-text tracking-tight text-center">
            {t.createScheduleTitle}
          </h2>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={clsx(
              "text-[17px] font-semibold text-ios-accent active:opacity-60 transition-opacity flex items-center gap-1.5",
              isSaving && "opacity-40 pointer-events-none"
            )}
          >
            {isSaving ? (
              <span className="text-[15px]">{t.savingStatus}</span>
            ) : (
              <span>{t.saveBtn}</span>
            )}
          </button>
        </div>
      </header>

      {/* Main Form Content */}
      <div className="w-full max-w-lg mx-auto px-4 pt-4 pb-20 space-y-4">
        {/* Target Week Header + Forward Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5 xs:gap-2">
            <span className="text-[26px] xs:text-[30px] sm:text-[34px] font-black text-ios-text tracking-tight leading-none">
              {startStr}
            </span>
            <span className="text-[22px] xs:text-[26px] sm:text-[30px] font-bold text-ios-text tracking-tight leading-none">
              —
            </span>
            <span className="text-[26px] xs:text-[30px] sm:text-[34px] font-black text-ios-text tracking-tight leading-none">
              {endStr}
            </span>
          </div>

          {/* Navigation buttons: only forward (prev disabled if at current week) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevWeek}
              disabled={!canPrev}
              className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center bg-ios-card transition-all shadow-sm",
                canPrev
                  ? "text-ios-textSecondary hover:text-ios-text active:scale-90 cursor-pointer"
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
                  ? "text-ios-textSecondary hover:text-ios-text active:scale-90 cursor-pointer"
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

        {/* Quick swap hint if active */}
        {selectedSwapDay && (
          <div className="py-2 px-3 rounded-xl bg-ios-accent/10 border border-ios-accent/25 text-ios-accent text-[13px] font-medium flex items-center justify-between animate-fadeIn">
            <span>
              {t.swapHint}: <strong className="font-bold">{selectedSwapDay}</strong> ⇄ ?
            </span>
            <button
              onClick={() => setSelectedSwapDay(null)}
              className="text-xs font-semibold text-ios-accent underline"
            >
              {t.cancelBtn}
            </button>
          </div>
        )}

        {/* 7 Days Schedule Form Card */}
        <div className="rounded-ios bg-ios-card shadow-ios-card dark:shadow-ios-card-dark px-4 sm:px-5 py-2 transition-all">
          <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
            {weekDays.map((day) => {
              // Map day to ru key: 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'
              const dayIndex = day.dayOfWeek === 0 ? 6 : day.dayOfWeek - 1;
              const dayKey = DAY_KEYS[dayIndex];
              const shiftValue = shifts[dayKey] || '';
              const dateLabel = `${String(day.date.getDate()).padStart(2, '0')}.${String(day.date.getMonth() + 1).padStart(2, '0')}`;
              const isSwapSelected = selectedSwapDay === dayKey;
              const isBeingDragged = draggedDay === dayKey;

              return (
                <div
                  key={day.isoDate}
                  draggable
                  onDragStart={(e) => handleDragStart(e, dayKey)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, dayKey)}
                  className={clsx(
                    "py-3 px-1 flex items-center justify-between transition-all gap-2.5 rounded-lg",
                    isSwapSelected && "bg-ios-accent/15 ring-2 ring-ios-accent/40",
                    isBeingDragged && "opacity-50"
                  )}
                >
                  {/* Left: Short Day in red + Date */}
                  <div className="flex items-baseline gap-2 shrink-0">
                    <span className="text-[16px] sm:text-[16.5px] font-bold text-ios-red leading-snug w-[28px] shrink-0">
                      {day.shortName}
                    </span>
                    <span className="text-[12px] font-medium text-ios-textSecondary leading-none tabular-nums w-[36px]">
                      {dateLabel}
                    </span>
                  </div>

                  {/* Middle: Text Input for employee name */}
                  <div className="flex-1 min-w-0 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] focus-within:ring-2 focus-within:ring-ios-accent/30 transition-all">
                    <input
                      type="text"
                      value={shiftValue}
                      onChange={(e) => handleShiftChange(dayKey, e.target.value)}
                      placeholder={t.employeePlaceholder}
                      className="w-full bg-transparent text-[15px] sm:text-[15.5px] font-semibold text-ios-text placeholder:italic placeholder:font-normal placeholder:text-ios-textSecondary focus:outline-none"
                    />

                    {/* Quick clear button if filled */}
                    {shiftValue && (
                      <button
                        type="button"
                        onClick={() => handleClearDay(dayKey)}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-ios-textSecondary hover:text-ios-text active:scale-90"
                        title={t.noShiftScheduled}
                      >
                        <SFSymbol
                          src="/symbols/SVG_Vector/12_close_xmark.svg"
                          className="w-3.5 h-3.5"
                        />
                      </button>
                    )}
                  </div>

                  {/* Right: Drag / Swap handle */}
                  <button
                    type="button"
                    onClick={() => handleDaySelectForSwap(dayKey)}
                    className={clsx(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-ios-textSecondary hover:text-ios-text active:scale-90 cursor-grab transition-all",
                      isSwapSelected && "text-ios-accent bg-ios-accent/15"
                    )}
                    title={t.swapHint}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                    >
                      <path d="M4 8h16M4 16h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset / Pre-fill from current week button */}
        {currentWeekSchedule && (
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleResetToTemplate}
              className="py-2.5 px-4 rounded-xl bg-ios-card shadow-sm border border-black/[0.06] dark:border-white/[0.08] text-[14px] font-medium text-ios-accent hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
            >
              <SFSymbol
                src="/symbols/SVG_Vector/07_schedule_calendar.svg"
                className="w-4 h-4 text-ios-accent"
              />
              <span>{t.resetToTemplate}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
