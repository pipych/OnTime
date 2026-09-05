export type Language = 'ru' | 'uk';

export interface Translations {
  // Navigation & Common
  appTitle: string;
  tabHome: string;
  tabSchedule: string;
  prevWeek: string;
  nextWeek: string;

  // Days short & full (index 0 is Sunday!)
  daysShort: string[];
  daysFull: string[];
  monthsGenitive: string[];

  // Schedule Page
  allChargedBtn: string;
  allChargedOnToday: string;
  chargedStatus: string;
  pendingStatus: string;
  sundayAuditTitle: string;
  sundayAuditDesc: string;
  debtBadge: string;

  // Home Page
  systemActive: string;
  welcomeGreeting: (name: string) => string;
  welcomeDesc: string;
  todayTasksGreeting: (name: string) => string;
  chargesWidgetTitle: string;
  chargesCountToday: (charged: number, total: number) => string;
  checkDevices: string;
  shiftsTitle: string;
  cleaningTitle: string;
  inDevelopment: string;
  defaultUserName: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  ru: {
    appTitle: 'Вчасно',
    tabHome: 'Главная',
    tabSchedule: 'Зарядки',
    prevWeek: 'Предыдущая неделя',
    nextWeek: 'Следующая неделя',

    // 0: Вс, 1: Пн, 2: Вт, 3: Ср, 4: Чт, 5: Пт, 6: Сб
    daysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    daysFull: [
      'Воскресенье',
      'Понедельник',
      'Вторник',
      'Среда',
      'Четверг',
      'Пятница',
      'Суббота',
    ],
    monthsGenitive: [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
    ],

    allChargedBtn: 'Всё заряжено',
    allChargedOnToday: 'На сегодня все заряжено!',
    chargedStatus: 'Заряжено',
    pendingStatus: 'Ожидает зарядки',
    sundayAuditTitle: 'Воскресный аудит зарядок!',
    sundayAuditDesc: 'Эти устройства не заряжались на текущей неделе. Зарядите их сегодня, чтобы избежать штрафа.',
    debtBadge: 'Долг',

    systemActive: 'Система активна',
    welcomeGreeting: (name: string) => `Привет, ${name}! 👋`,
    welcomeDesc: 'Здесь скоро появятся быстрые действия, статистика смен и отчёты. Сейчас доступен календарный график зарядок устройств.',
    todayTasksGreeting: (name: string) => `Привет, ${name}! Вот список задач на сегодня:`,
    chargesWidgetTitle: 'Зарядки',
    chargesCountToday: (charged: number, total: number) => `Сегодня заряжено ${charged} из ${total}`,
    checkDevices: 'Проверить устройства',
    shiftsTitle: 'Рабочие выходы',
    cleaningTitle: 'Ген. уборка',
    inDevelopment: 'В разработке',
    defaultUserName: 'Коллега',
  },

  uk: {
    appTitle: 'Вчасно',
    tabHome: 'Головна',
    tabSchedule: 'Зарядки',
    prevWeek: 'Попередній тиждень',
    nextWeek: 'Наступний тиждень',

    // 0: Нд, 1: Пн, 2: Вт, 3: Ср, 4: Чт, 5: Пт, 6: Сб
    daysShort: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    daysFull: [
      'Неділя',
      'Понеділок',
      'Вівторок',
      'Середа',
      'Четвер',
      'П\'ятниця',
      'Субота',
    ],
    monthsGenitive: [
      'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
      'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
    ],

    allChargedBtn: 'Все заряджено',
    allChargedOnToday: 'На сьогодні все заряджено!',
    chargedStatus: 'Заряджено',
    pendingStatus: 'Очікує зарядки',
    sundayAuditTitle: 'Недільний аудит зарядок!',
    sundayAuditDesc: 'Ці пристрої не заряджалися на поточному тижні. Зарядіть їх сьогодні, щоб уникнути штрафу.',
    debtBadge: 'Борг',

    systemActive: 'Система активна',
    welcomeGreeting: (name: string) => `Привіт, ${name}! 👋`,
    welcomeDesc: 'Тут незабаром з\'являться швидкі дії, статистика змін та звіти. Зараз доступний календарний графік зарядок пристроїв.',
    todayTasksGreeting: (name: string) => `Привіт, ${name}! Ось список завдань на сьогодні:`,
    chargesWidgetTitle: 'Зарядки',
    chargesCountToday: (charged: number, total: number) => `Сьогодні заряджено ${charged} з ${total}`,
    checkDevices: 'Перевірити пристрої',
    shiftsTitle: 'Робочі виходи',
    cleaningTitle: 'Ген. прибирання',
    inDevelopment: 'У розробці',
    defaultUserName: 'Колега',
  },
};
