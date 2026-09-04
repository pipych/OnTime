import { CHARGE_DAYS_MAP, MONTHS_GENITIVE_RU, MONTHS_RU } from '../constants/devices';
import { TRANSLATIONS, type Language } from '../constants/i18n';
import type { DayInfo } from '../types';

export const MIN_WEEK_OFFSET = -2; // Allowed: 2 weeks in past (-2, -1)
export const MAX_WEEK_OFFSET = 1;  // Allowed: 1 week in future (+1)

export function getMondayOfWeek(d: Date): Date {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date;
}

export function getWeekOffset(targetDate: Date, baseDate: Date = new Date()): number {
  const mTarget = getMondayOfWeek(targetDate);
  const mBase = getMondayOfWeek(baseDate);
  const diffMs = mTarget.getTime() - mBase.getTime();
  return Math.round(diffMs / (7 * 86400000));
}

export function canNavigatePrevWeek(currentDate: Date, baseDate: Date = new Date()): boolean {
  return getWeekOffset(currentDate, baseDate) > MIN_WEEK_OFFSET;
}

export function canNavigateNextWeek(currentDate: Date, baseDate: Date = new Date()): boolean {
  return getWeekOffset(currentDate, baseDate) < MAX_WEEK_OFFSET;
}

export function getWeekId(dateObj?: Date): string {
  const d = dateObj ? new Date(dateObj.getTime()) : new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const year = d.getFullYear();
  const firstJan = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((d.getTime() - firstJan.getTime()) / 86400000) + 1) / 7);
  return `${year}_W${weekNum}`;
}

export function formatISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekRangeStr(dateObj: Date): string {
  const d = new Date(dateObj.getTime());
  const day = d.getDay() || 7;
  const mon = new Date(d.getTime());
  mon.setDate(d.getDate() - day + 1);
  const sun = new Date(d.getTime());
  sun.setDate(d.getDate() - day + 7);

  const f = (date: Date) =>
    String(date.getDate()).padStart(2, '0') + '.' + String(date.getMonth() + 1).padStart(2, '0');

  return `${f(mon)} — ${f(sun)}`;
}

export function getDaysForWeek(referenceDate: Date = new Date(), lang: Language = 'ru'): DayInfo[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = new Date(referenceDate.getTime());
  current.setHours(0, 0, 0, 0);

  // Day of week: 1 (Mon) to 7 (Sun)
  const currentDayOfWeek = current.getDay() || 7;

  // Monday of the week
  const monday = new Date(current.getTime());
  monday.setDate(current.getDate() - currentDayOfWeek + 1);

  const days: DayInfo[] = [];
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ru;

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday.getTime());
    dayDate.setDate(monday.getDate() + i);

    const dayOfWeek = dayDate.getDay(); // 0 is Sun, 1 is Mon...
    const isToday = dayDate.getTime() === today.getTime();
    const isPast = dayDate.getTime() < today.getTime();
    const isFuture = dayDate.getTime() > today.getTime();
    const weekId = getWeekId(dayDate);

    days.push({
      date: dayDate,
      isoDate: formatISODate(dayDate),
      dayOfWeek,
      shortName: t.daysShort[dayOfWeek],
      fullName: t.daysFull[dayOfWeek],
      dayOfMonth: dayDate.getDate(),
      monthName: MONTHS_RU[dayDate.getMonth()],
      isToday,
      isPast,
      isFuture,
      weekId,
      deviceKeys: CHARGE_DAYS_MAP[dayOfWeek] || [],
    });
  }

  return days;
}

export function formatFriendlyDate(date: Date): string {
  const day = date.getDate();
  const month = MONTHS_GENITIVE_RU[date.getMonth()];
  return `${day} ${month}`;
}
