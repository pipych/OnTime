export type Language = 'ru' | 'uk';

export interface Translations {
  // Navigation & Common
  appTitle: string;
  tabHome: string;
  tabSchedule: string;
  tabWorkSchedule: string;
  noShiftScheduled: string;
  scheduleEmptyWeek: string;
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

  // Settings
  settingsTitle: string;
  remindersCategory: string;
  remindersShifts: string;
  remindersShiftsDesc: string;
  reminderTimeTitle: string;
  reminderTimePrefix: string;
  remindersCharges: string;
  remindersChargesDesc: string;
  remindersGU: string;
  remindersGUDesc: string;
  remindersSchedule: string;
  remindersScheduleDesc: string;
  appSettingsCategory: string;
  appLanguage: string;
  userProfile: string;
  back: string;
  done: string;
  selectReminderTime: string;

  // Schedule Editor
  createScheduleTitle: string;
  saveBtn: string;
  cancelBtn: string;
  employeePlaceholder: string;
  resetToTemplate: string;
  savingStatus: string;
  savedSuccess: string;
  swapHint: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  ru: {
    appTitle: 'Вчасно',
    tabHome: 'Главная',
    tabSchedule: 'Зарядки',
    tabWorkSchedule: 'График',
    noShiftScheduled: 'Выходной',
    scheduleEmptyWeek: 'График на эту неделю ещё не загружен',
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
    chargesWidgetTitle: 'График зарядок',
    chargesCountToday: (charged: number, total: number) => `Сегодня заряжено ${charged} из ${total}`,
    checkDevices: 'Проверить устройства',
    shiftsTitle: 'Рабочие выходы',
    cleaningTitle: 'Ген. уборка',
    inDevelopment: 'В разработке',
    defaultUserName: 'Коллега',

    // Settings
    settingsTitle: 'Настройки',
    remindersCategory: 'Напоминания',
    remindersShifts: 'Выходы',
    remindersShiftsDesc: 'Напоминания об отправке выходов',
    reminderTimeTitle: 'Время выходов',
    reminderTimePrefix: 'Время:',
    remindersCharges: 'Зарядка устройств',
    remindersChargesDesc: 'Вечерняя проверка зарядок устройств',
    remindersGU: 'Генеральная уборка',
    remindersGUDesc: 'Напоминания о начале и фото ГУ',
    remindersSchedule: 'График смен',
    remindersScheduleDesc: 'Напоминание отправить график работы',
    appSettingsCategory: 'Настройки приложения',
    appLanguage: 'Язык',
    userProfile: 'Пользователь',
    back: 'Назад',
    done: 'Готово',
    selectReminderTime: 'Выберите время напоминания',

    // Schedule Editor
    createScheduleTitle: 'Новый график',
    saveBtn: 'Сохранить',
    cancelBtn: 'Отмена',
    employeePlaceholder: 'Имя сотрудника...',
    resetToTemplate: 'Шаблон с текущей недели',
    savingStatus: 'Сохранение...',
    savedSuccess: 'График сохранен',
    swapHint: 'Нажмите, чтобы поменять местами',
  },

  uk: {
    appTitle: 'Вчасно',
    tabHome: 'Головна',
    tabSchedule: 'Зарядки',
    tabWorkSchedule: 'Графік',
    noShiftScheduled: 'Вихідний',
    scheduleEmptyWeek: 'Графік на цей тиждень ще не завантажено',
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
      'Пʼятниця',
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
    chargesWidgetTitle: 'Графік зарядок',
    chargesCountToday: (charged: number, total: number) => `Сьогодні заряджено ${charged} з ${total}`,
    checkDevices: 'Перевірити пристрої',
    shiftsTitle: 'Робочі виходи',
    cleaningTitle: 'Ген. прибирання',
    inDevelopment: 'У розробці',
    defaultUserName: 'Колега',

    // Settings
    settingsTitle: 'Налаштування',
    remindersCategory: 'Нагадування',
    remindersShifts: 'Виходи',
    remindersShiftsDesc: 'Нагадування про надсилання виходів',
    reminderTimeTitle: 'Час виходів',
    reminderTimePrefix: 'Час:',
    remindersCharges: 'Зарядка пристроїв',
    remindersChargesDesc: 'Вечірня перевірка зарядок пристроїв',
    remindersGU: 'Генеральне прибирання',
    remindersGUDesc: 'Нагадування про початок та фото ГУ',
    remindersSchedule: 'Графік змін',
    remindersScheduleDesc: 'Нагадування надіслати графік роботи',
    appSettingsCategory: 'Налаштування застосунку',
    appLanguage: 'Мова',
    userProfile: 'Користувач',
    back: 'Назад',
    done: 'Готово',
    selectReminderTime: 'Оберіть час нагадування',

    // Schedule Editor
    createScheduleTitle: 'Новий графік',
    saveBtn: 'Зберегти',
    cancelBtn: 'Скасувати',
    employeePlaceholder: "Ім'я працівника...",
    resetToTemplate: 'Шаблон з поточного тижня',
    savingStatus: 'Збереження...',
    savedSuccess: 'Графік збережено',
    swapHint: 'Натисніть, щоб поміняти місцями',
  },
};
