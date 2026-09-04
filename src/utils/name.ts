import type { Language } from '../constants/i18n';

/**
 * Extracts strictly the first name for friendly display without surnames,
 * with proper Ukrainian localization for Alina Zvereva.
 */
export function getFirstName(fullName?: string, lang?: Language): string {
  if (!fullName) return '';
  // Remove any telegram handles or bracketed text like (@username)
  const clean = fullName.replace(/\s*\(.*?\)\s*/g, '').trim();
  if (!clean) return '';

  const lower = clean.toLowerCase();
  if (lower.includes('алін') || lower.includes('алин')) {
    return lang === 'uk' ? 'Аліна' : 'Алина';
  }
  if (lower.includes('артем') || lower.includes('артём')) {
    return 'Артем';
  }
  if (lower.includes('богдан')) {
    return 'Богдан';
  }

  const parts = clean.split(/\s+/);
  if (parts.length <= 1) return clean;

  // Check if first word is a surname (ends with -ов, -ова, -ев, -єв, -ева, -єва, -ин, -ина, -ін, -іна, -ский, -ская, -ський, -ська)
  const surnameRegex = /(ов|ова|ев|єв|ева|єва|ин|ина|ін|іна|ский|ская|ський|ська)$/i;
  if (surnameRegex.test(parts[0]) && !surnameRegex.test(parts[1])) {
    return parts[1];
  }

  // Otherwise default to first word (standard "Name Surname")
  return parts[0];
}

/**
 * Formats one or multiple employee names for responsible badges
 */
export function formatResponsibleName(rawNames?: string, lang?: Language): string {
  if (!rawNames) return '';
  const parts = rawNames.split(/[,/\\+]/);
  return parts
    .map((p) => getFirstName(p.trim(), lang))
    .filter(Boolean)
    .join(', ');
}

/**
 * Resolves the raw employee name from the schedule map for a given day of week (0..6)
 */
export function getResponsibleForDay(
  schedule: Record<string, string> | null | undefined,
  dayOfWeek: number
): string | undefined {
  if (!schedule) return undefined;

  const dayKeysMap: Record<number, string[]> = {
    1: ['Пн', 'Понедельник', 'Понеділок', 'Mon', '1'],
    2: ['Вт', 'Вторник', 'Вівторок', 'Tue', '2'],
    3: ['Ср', 'Среда', 'Середа', 'Wed', '3'],
    4: ['Чт', 'Четверг', 'Четвер', 'Thu', '4'],
    5: ['Пт', 'Пятница', "П'ятниця", 'П’ятниця', 'Fri', '5'],
    6: ['Сб', 'Суббота', 'Субота', 'Sat', '6'],
    0: ['Вс', 'Нд', 'Воскресенье', 'Неділя', 'Sun', '0', '7'],
  };

  const candidateKeys = dayKeysMap[dayOfWeek] || [];
  for (const k of candidateKeys) {
    if (schedule[k]) return schedule[k];
  }

  // Case-insensitive and trimmed fallback
  for (const [schedKey, schedVal] of Object.entries(schedule)) {
    const cleanKey = schedKey.replace(/[:.]/g, '').trim().toLowerCase();
    if (candidateKeys.some((ck) => ck.toLowerCase() === cleanKey)) {
      return schedVal;
    }
  }

  return undefined;
}
