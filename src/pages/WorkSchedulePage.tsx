import React, { useState, useEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import {
  getDaysForWeek,
  getWeekId,
  getWeekRangeStr,
  canNavigatePrevWeek,
  canNavigateNextWeek,
} from '../utils/date';
import { SFSymbol } from '../components/SFSymbol';
import { useI18n } from '../context/I18nContext';
import type { Language } from '../constants/i18n';
import {
  fetchWeeklyDataFromGAS,
  getLocalSchedule,
} from '../services/api';

interface WorkSchedulePageProps {
  userId?: number | string;
  userName?: string;
  onHapticImpact?: (style?: 'light' | 'medium' | 'heavy') => void;
  onHapticSelection?: () => void;
}

const DAY_KEY_MAP: Record<number, string[]> = {
  1: ['Пн', 'ПН', 'пн', 'Понедельник', 'Понеділок'],
  2: ['Вт', 'ВТ', 'вт', 'Вторник', 'Вівторок'],
  3: ['Ср', 'СР', 'ср', 'Среда', 'Середа'],
  4: ['Чт', 'ЧТ', 'чт', 'Четверг', 'Четвер'],
  5: ['Пт', 'ПТ', 'пт', 'Пятница', 'Пʼятниця', 'Пятниця'],
  6: ['Сб', 'СБ', 'сб', 'Суббота', 'Субота'],
  0: ['Вс', 'ВС', 'вс', 'Нд', 'НД', 'нд', 'Воскресенье', 'Неділя'],
};

function formatSingleName(name: string, lang: Language): string {
  const lower = name.toLowerCase();
  if (
    (lower.includes('алин') || lower.includes('алін')) &&
    (lower.includes('зверев') || lower.includes('звєр') || lower.includes('звєреаа'))
  ) {
    return lang === 'uk' ? 'Аліна Звєрева' : 'Алина Зверева';
  }
  return name;
}

function formatScheduleEmployeeName(rawName: string | undefined, lang: Language): string {
  if (!rawName || !rawName.trim()) return '';

  // Remove any (@username) part
  const cleaned = rawName.replace(/\(@[^\)]+\)/g, '').trim();

  // If contains commas or newlines, format each person
  const parts = cleaned.split(/[\n,]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts.map((part) => formatSingleName(part, lang)).join(', ');
  }
  return formatSingleName(cleaned, lang);
}

function getShiftForDay(schedule: Record<string, string> | null, dayOfWeek: number): string {
  if (!schedule) return '';
  const possibleKeys = DAY_KEY_MAP[dayOfWeek] || [];
  for (const key of possibleKeys) {
    if (schedule[key] && schedule[key].trim()) {
      return schedule[key].trim();
    }
  }
  return '';
}

export const WorkSchedulePage: React.FC<WorkSchedulePageProps> = ({
  onHapticImpact,
}) => {
  const { lang, t } = useI18n();

  // Current active date reference
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());

  const currentWeekId = useMemo(() => {
    return getWeekId(referenceDate);
  }, [referenceDate]);

  // Current week's days
  const weekDays = useMemo(() => {
    return getDaysForWeek(referenceDate, lang);
  }, [referenceDate, lang]);

  // Allowed navigation bounds (-2 past weeks, +1 future week)
  const canPrev = useMemo(() => canNavigatePrevWeek(referenceDate), [referenceDate]);
  const canNext = useMemo(() => canNavigateNextWeek(referenceDate), [referenceDate]);

  // Week range start and end strings (e.g. "07.09" and "13.09")
  const [startStr, endStr] = useMemo(() => {
    const range = getWeekRangeStr(referenceDate);
    const parts = range.split(' — ');
    return [parts[0] || '', parts[1] || ''];
  }, [referenceDate]);

  // Schedule data cache
  const [schedules, setSchedules] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {};
    const cached = getLocalSchedule(getWeekId(new Date()));
    if (cached) {
      initial[getWeekId(new Date())] = cached;
    }
    return initial;
  });

  const activeWeekRef = useRef<string>(currentWeekId);
  activeWeekRef.current = currentWeekId;

  // Load schedule for current week
  useEffect(() => {
    const targetWeek = currentWeekId;

    // 1. Instant load from local cache if not yet loaded
    const cached = getLocalSchedule(targetWeek);
    if (cached) {
      setSchedules((prev) => ({ ...prev, [targetWeek]: cached }));
    }

    // 2. Fetch from GAS in background
    fetchWeeklyDataFromGAS(targetWeek)
      .then((res) => {
        if (activeWeekRef.current === targetWeek && res.schedule) {
          setSchedules((prev) => ({ ...prev, [targetWeek]: res.schedule! }));
        }
      })
      .catch((err) => {
        console.warn('Failed to load schedule for', targetWeek, err);
      });
  }, [currentWeekId]);

  const currentSchedule = schedules[currentWeekId] || null;

  // Navigation handlers
  const handlePrevWeek = () => {
    if (!canPrev) return;
    onHapticImpact?.('light');
    const d = new Date(referenceDate.getTime());
    d.setDate(d.getDate() - 7);
    setReferenceDate(d);
  };

  const handleNextWeek = () => {
    if (!canNext) return;
    onHapticImpact?.('light');
    const d = new Date(referenceDate.getTime());
    d.setDate(d.getDate() + 7);
    setReferenceDate(d);
  };

  // Check if current week has any shifts populated
  const hasAnyShifts = useMemo(() => {
    if (!currentSchedule) return false;
    return weekDays.some((day) => Boolean(getShiftForDay(currentSchedule, day.dayOfWeek)));
  }, [currentSchedule, weekDays]);

  return (
    <div className="w-full max-w-lg mx-auto px-4 pt-3 pb-36 space-y-4 animate-fadeIn">
      {/* Top Header: Week Range (e.g. 07.09 — 13.09) + Week Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5 xs:gap-2">
          <span className="text-[28px] xs:text-[32px] sm:text-[36px] font-black text-ios-text tracking-tight leading-none">
            {startStr}
          </span>
          <span className="text-[24px] xs:text-[28px] sm:text-[32px] font-bold text-ios-red tracking-tight leading-none">
            —
          </span>
          <span className="text-[28px] xs:text-[32px] sm:text-[36px] font-black text-ios-text tracking-tight leading-none">
            {endStr}
          </span>
        </div>

        {/* Week navigation buttons */}
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

      {/* Week Schedule List Card */}
      <div className="bg-ios-card rounded-[22px] border border-[var(--ios-border)] shadow-sm overflow-hidden divide-y divide-[var(--ios-border)]">
        {weekDays.map((day) => {
          const rawShift = getShiftForDay(currentSchedule, day.dayOfWeek);
          const formattedShift = formatScheduleEmployeeName(rawShift, lang);
          const dateLabel = `${String(day.date.getDate()).padStart(2, '0')}.${String(day.date.getMonth() + 1).padStart(2, '0')}`;

          return (
            <div
              key={day.isoDate}
              className={clsx(
                "flex items-center justify-between py-3.5 px-4 transition-colors",
                day.isToday && "bg-ios-accent/[0.06] dark:bg-ios-accent/[0.10]"
              )}
            >
              {/* Left Column: Day of week in red + Date below */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[17px] font-bold text-ios-red leading-tight">
                    {day.fullName}
                  </span>
                  {day.isToday && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-ios-accent/15 text-ios-accent">
                      {lang === 'uk' ? 'Сьогодні' : 'Сегодня'}
                    </span>
                  )}
                </div>
                <span className="text-[13px] font-medium text-ios-textSecondary mt-0.5 leading-tight">
                  {dateLabel}
                </span>
              </div>

              {/* Right Column: Employee Name or Off Status */}
              <div className="text-right pl-3">
                {formattedShift ? (
                  <span className="text-[16px] font-semibold text-ios-text leading-tight block">
                    {formattedShift}
                  </span>
                ) : (
                  <span className="text-[14px] italic text-ios-textSecondary leading-tight block">
                    {t.noShiftScheduled}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Helper Note when week is completely empty */}
      {!hasAnyShifts && (
        <div className="p-4 rounded-[18px] bg-ios-card/60 border border-[var(--ios-border)] text-center text-ios-textSecondary text-[13px]">
          {t.scheduleEmptyWeek}
        </div>
      )}
    </div>
  );
};
