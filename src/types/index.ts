export type DeviceKey =
  | 'ITEM_TWS'
  | 'ITEM_OVEREAR'
  | 'ITEM_HEADSET'
  | 'ITEM_PHONES'
  | 'ITEM_FLASHLIGHTS'
  | 'ITEM_POWERBANKS'
  | 'ITEM_WATCHES'
  | 'ITEM_GREEN_WATCH'
  | 'ITEM_SPEAKERS'
  | 'ITEM_LIGHTERS'
  | 'ITEM_CAMERAS'
  | 'ITEM_CONSOLES'
  | 'ITEM_MISC';

export interface DeviceInfo {
  key: DeviceKey;
  nameRu: string;
  nameUk: string;
  category: string;
  symbolSvg: string;
  symbolPngWhite: string;
  symbolPngBlack: string;
  priority: number;
}

export interface DayInfo {
  date: Date;
  isoDate: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  shortName: string; // Пн, Вт...
  fullName: string; // Понедельник, Вторник...
  dayOfMonth: number;
  monthName: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  weekId: string;
  deviceKeys: DeviceKey[];
}

export type TabType = 'home' | 'schedule';

export interface WeekChargesResponse {
  ok: boolean;
  week: string;
  charges: Record<string, string>;
  schedule?: Record<string, string> | null;
  allowed_weeks?: string[];
}
