import { CHARGE_DAYS_MAP, DAYS_FULL_RU, DAYS_SHORT_RU, MONTHS_GENITIVE_RU, MONTHS_RU } from '../constants/devices';
import type { DayInfo } from '../types';

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

export function getDaysForWeek(referenceDate: Date = new Date()): DayInfo[] {
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
      shortName: DAYS_SHORT_RU[dayOfWeek],
      fullName: DAYS_FULL_RU[dayOfWeek],
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
