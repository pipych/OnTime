import type { DeviceInfo, DeviceKey } from '../types';

export const DEVICES: Record<DeviceKey, DeviceInfo> = {
  ITEM_TWS: {
    key: 'ITEM_TWS',
    nameRu: 'Наушники TWS',
    nameUk: 'Навушники TWS',
    category: 'Аудио',
    symbolSvg: '/symbols/SVG_Vector/16_device_tws_airpods.svg',
    symbolPngWhite: '/symbols/PNG_White_512x512/16_device_tws_airpods.png',
    symbolPngBlack: '/symbols/PNG_Black_512x512/16_device_tws_airpods.png',
    priority: 3,
  },
  ITEM_OVEREAR: {
    key: 'ITEM_OVEREAR',
    nameRu: 'Накладные наушники',
    nameUk: 'Накладні навушники',
    category: 'Аудио',
    symbolSvg: '/symbols/SVG_Vector/18_device_headphones.svg',
    symbolPngWhite: '/symbols/PNG_White_512x512/18_device_headphones.png',
    symbolPngBlack: '/symbols/PNG_Black_512x512/18_device_headphones.png',
    priority: 3,
  },
  ITEM_HEADSET: {
    key: 'ITEM_HEADSET',
    nameRu: 'Гарнитуры',
    nameUk: 'Гарнітури',
    category: 'Аудио',
    symbolSvg: '/symbols/SVG_Vector/19_device_headset.svg',
    symbolPngWhite: '/symbols/PNG_White_512x512/19_device_headset.png',
    symbolPngBlack: '/symbols/PNG_Black_512x512/19_device_headset.png',
    priority: 3,
  },
  ITEM_PHONES: {
    key: 'ITEM_PHONES',
    nameRu: 'Телефоны',
    nameUk: 'Телефони',
    category: 'Гаджеты',
    symbolSvg: '/symbols/SVG_Vector/20_device_phones.svg',
    symbolPngWhite: '/symbols/PNG_White_512x512/20_device_phones.png',
    symbolPngBlack: '/symbols/PNG_Black_512x512/20_device_phones.png',
    priority: 1,
  },
  ITEM_FLASHLIGHTS: {
    key: 'ITEM_FLASHLIGHTS',
    nameRu: 'Фонари',
    nameUk: 'Ліхтарі',
    category: 'Свет',
    symbolSvg: '/symbols/SVG_Vector/21_device_flashlight.svg',
    symbolPngWhite: '/symbols/PNG_White_512x512/21_device_flashlight.png',
    symbolPngBlack: '/symbols/PNG_Black_512x512/21_device_flashlight.png',
    priority: 4,
  },
  ITEM_POWERBANKS: {
    key: 'ITEM_POWERBANKS',
    nameRu: 'Повербанки',
    nameUk: 'Повербанки',
    category: 'Питание',
    symbolSvg: '/symbols/SVG_Vector/02_charge_battery_bolt.svg',
    symbolPngWhite: '/symbols/PNG_White_512x512/02_charge_battery_bolt.png',
    symbolPngBlack: '/symbols/PNG_Black_512x512/02_charge_battery_bolt.png',
    priority: 5,
  },
  ITEM_WATCHES: {
    key: 'ITEM_WATCHES',
    nameRu: 'Смарт часы',
    nameUk: 'Смарт годинники',
    category: 'Носимые',
    symbolSvg: '/symbols/SVG_Vector/22_device_watches.svg',
    symbolPngWhite: '/symbols/PNG_White_512x512/22_device_watches.png',
    symbolPngBlack: '/symbols/PNG_Black_512x512/22_device_watches.png',
    priority: 2,
  },
  ITEM_GREEN_WATCH: {
    key: 'ITEM_GREEN_WATCH',
    nameRu: 'Зеленые смарт часы',
    nameUk: 'Зелені смарт годинники',
    category: 'Носимые',
    symbolSvg: '/symbols/SVG_Vector/23_device_green_watch.svg',
    symbolPngWhite: '/symbols/PNG_White_512x512/23_device_green_watch.png',
    symbolPngBlack: '/symbols/PNG_Black_512x512/23_device_green_watch.png',
    priority: 2,
  },
  ITEM_SPEAKERS: {
    key: 'ITEM_SPEAKERS',
    nameRu: 'Колонки',
    nameUk: 'Колонки',
    category: 'Акустика',
    symbolSvg: '/symbols/SVG_Vector/24_device_speakers.svg',
    symbolPngWhite: '/symbols/PNG_White_512x512/24_device_speakers.png',
    symbolPngBlack: '/symbols/PNG_Black_512x512/24_device_speakers.png',
    priority: 6,
  },
  ITEM_LIGHTERS: {
    key: 'ITEM_LIGHTERS',
    nameRu: 'Зажигалки',
    nameUk: 'Запальнички',
    category: 'Аксессуары',
    symbolSvg: '/symbols/SVG_Vector/25_device_lighters.svg',
    symbolPngWhite: '/symbols/PNG_White_512x512/25_device_lighters.png',
    symbolPngBlack: '/symbols/PNG_Black_512x512/25_device_lighters.png',
    priority: 6,
  },
  ITEM_CAMERAS: {
    key: 'ITEM_CAMERAS',
    nameRu: 'Детские камеры',
    nameUk: 'Дитячі камери',
    category: 'Фото/Видео',
    symbolSvg: '/symbols/SVG_Vector/26_device_cameras.svg',
    symbolPngWhite: '/symbols/PNG_White_512x512/26_device_cameras.png',
    symbolPngBlack: '/symbols/PNG_Black_512x512/26_device_cameras.png',
    priority: 6,
  },
  ITEM_CONSOLES: {
    key: 'ITEM_CONSOLES',
    nameRu: 'Приставки',
    nameUk: 'Приставки',
    category: 'Гейминг',
    symbolSvg: '/symbols/SVG_Vector/27_device_consoles.svg',
    symbolPngWhite: '/symbols/PNG_White_512x512/27_device_consoles.png',
    symbolPngBlack: '/symbols/PNG_Black_512x512/27_device_consoles.png',
    priority: 6,
  },
  ITEM_MISC: {
    key: 'ITEM_MISC',
    nameRu: 'Подобная мелочь',
    nameUk: 'Подібні дрібниці',
    category: 'Прочее',
    symbolSvg: '/symbols/SVG_Vector/28_device_misc_cube.svg',
    symbolPngWhite: '/symbols/PNG_White_512x512/28_device_misc_cube.png',
    symbolPngBlack: '/symbols/PNG_Black_512x512/28_device_misc_cube.png',
    priority: 6,
  },
};

export const CHARGE_DAYS_MAP: Record<number, DeviceKey[]> = {
  1: ['ITEM_TWS', 'ITEM_OVEREAR', 'ITEM_HEADSET'], // Пн
  2: ['ITEM_PHONES', 'ITEM_FLASHLIGHTS'],          // Вт
  3: ['ITEM_POWERBANKS'],                          // Ср
  4: ['ITEM_WATCHES'],                             // Чт
  5: ['ITEM_SPEAKERS'],                            // Пт
  6: ['ITEM_LIGHTERS', 'ITEM_CAMERAS', 'ITEM_CONSOLES', 'ITEM_MISC'], // Сб
  0: ['ITEM_GREEN_WATCH'],                         // Вс
};

export const DEVICE_DAY_MAP: Record<DeviceKey, number> = {
  ITEM_TWS: 1,
  ITEM_OVEREAR: 1,
  ITEM_HEADSET: 1,
  ITEM_PHONES: 2,
  ITEM_FLASHLIGHTS: 2,
  ITEM_POWERBANKS: 3,
  ITEM_WATCHES: 4,
  ITEM_SPEAKERS: 5,
  ITEM_LIGHTERS: 6,
  ITEM_CAMERAS: 6,
  ITEM_CONSOLES: 6,
  ITEM_MISC: 6,
  ITEM_GREEN_WATCH: 0,
};

export const DAYS_SHORT_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
export const DAYS_FULL_RU = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
];

export const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
export const MONTHS_GENITIVE_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
