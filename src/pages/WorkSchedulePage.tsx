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
import { ScheduleEditorModal } from '../components/ScheduleEditorModal';

interface WorkSchedulePageProps {
  userId?: number | string;
  userName?: string;
  onHapticImpact?: (style?: 'light' | 'medium' | 'heavy') => void;
  onHapticSuccess?: () => void;
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
  userId,
  userName,
  onHapticImpact,
  onHapticSuccess,
}) => {
  const { lang, t } = useI18n();

  // Schedule editor modal visibility
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);

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
      <div className="rounded-ios bg-ios-card shadow-ios-card dark:shadow-ios-card-dark px-4 sm:px-5 py-2 sm:py-2.5 transition-all">
        <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
          {weekDays.map((day) => {
            const rawShift = getShiftForDay(currentSchedule, day.dayOfWeek);
            const formattedShift = formatScheduleEmployeeName(rawShift, lang);
            const dateLabel = `${String(day.date.getDate()).padStart(2, '0')}.${String(day.date.getMonth() + 1).padStart(2, '0')}`;

            return (
              <div
                key={day.isoDate}
                className={clsx(
                  "py-3 px-1 flex items-center justify-between transition-colors gap-3",
                  day.isToday && "bg-ios-accent/[0.06] dark:bg-ios-accent/[0.10]"
                )}
              >
                {/* Left: Short Day of Week in red + Employee Name right beside it */}
                <div className="flex items-baseline gap-2.5 min-w-0">
                  <span className="text-[16px] sm:text-[16.5px] font-bold text-ios-red leading-snug w-[28px] shrink-0">
                    {day.shortName}
                  </span>
                  {formattedShift ? (
                    <span className="text-[16.5px] sm:text-[17px] font-semibold text-ios-text leading-snug truncate">
                      {formattedShift}
                    </span>
                  ) : (
                    <span className="text-[15px] sm:text-[15.5px] italic text-ios-textSecondary leading-snug">
                      {t.noShiftScheduled}
                    </span>
                  )}
                </div>

                {/* Right: Date number */}
                <span className="text-[13px] sm:text-[13.5px] font-medium text-ios-textSecondary leading-none shrink-0 text-right tabular-nums">
                  {dateLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Helper Note when week is completely empty */}
      {!hasAnyShifts && (
        <div className="p-4 rounded-[18px] bg-ios-card/60 border border-[var(--ios-border)] text-center text-ios-textSecondary text-[13px]">
          {t.scheduleEmptyWeek}
        </div>
      )}

      {/* Floating Action Button (FAB) to create / edit schedule (Admin only) */}
      <div className="fixed right-5 bottom-[max(calc(env(safe-area-inset-bottom,0px)+96px),108px)] z-40">
        <button
          type="button"
          onClick={() => {
            onHapticImpact?.('medium');
            setIsEditorOpen(true);
          }}
          className="w-14 h-14 rounded-full bg-ios-accent text-white shadow-glow-accent flex items-center justify-center active:scale-90 hover:scale-105 transition-all duration-200 cursor-pointer"
          aria-label={t.createScheduleTitle}
        >
          <svg
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Schedule Editor Modal */}
      <ScheduleEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        currentWeekSchedule={currentSchedule || getLocalSchedule(getWeekId(new Date()))}
        userId={userId}
        userName={userName}
        onSaved={(savedWeekId, newSchedule) => {
          setSchedules((prev) => ({
            ...prev,
            [savedWeekId]: newSchedule,
          }));
        }}
        onHapticImpact={onHapticImpact}
        onHapticSuccess={onHapticSuccess}
      />
    </div>
  );
};
