import React, { useState } from 'react';
import clsx from 'clsx';
import { SFSymbol } from './SFSymbol';
import { IOSSwitch } from './IOSSwitch';
import { useI18n } from '../context/I18nContext';
import type { UserSettings, ReminderTime } from '../types';
import type { Language } from '../constants/i18n';
import {
  syncUserSettingToGAS,
  syncUserLangToGAS,
  saveLocalUserSettings,
} from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number | string;
  userName?: string;
  initialSettings: UserSettings;
  onSettingsChange?: (newSettings: UserSettings) => void;
  onHapticImpact?: (style?: 'light' | 'medium' | 'heavy') => void;
  onHapticSuccess?: () => void;
  onHapticSelection?: () => void;
}

const REMINDER_TIME_OPTIONS: { time: ReminderTime; isDefault?: boolean }[] = [
  { time: '18:05' },
  { time: '20:05' },
  { time: '20:35', isDefault: true },
  { time: '21:05' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName: _userName,
  initialSettings,
  onSettingsChange,
  onHapticImpact,
  onHapticSuccess,
  onHapticSelection,
}) => {
  const { lang, setLang, t } = useI18n();
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  // Sync state when initialSettings change externally
  React.useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  // Handle Telegram native BackButton and keyboard Escape
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTimePickerOpen) {
          setIsTimePickerOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const tg = window.Telegram?.WebApp;
    if (tg?.BackButton) {
      try {
        tg.BackButton.show();
        const onBackClick = () => {
          if (isTimePickerOpen) {
            setIsTimePickerOpen(false);
          } else {
            onClose();
          }
        };
        tg.BackButton.onClick(onBackClick);

        return () => {
          window.removeEventListener('keydown', handleKeyDown);
          try {
            tg.BackButton.offClick(onBackClick);
            tg.BackButton.hide();
          } catch (_) {}
        };
      } catch (_) {}
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isTimePickerOpen, onClose]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof UserSettings) => {
    const nextVal = !settings[key];
    const updated = { ...settings, [key]: nextVal };
    setSettings(updated);
    saveLocalUserSettings(updated);
    onSettingsChange?.(updated);
    syncUserSettingToGAS(userId, key, nextVal);
  };

  const handleSelectTime = (time: ReminderTime) => {
    onHapticSuccess?.();
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch (_) {}

    const updated: UserSettings = { ...settings, reminder_time: time };
    setSettings(updated);
    saveLocalUserSettings(updated);
    onSettingsChange?.(updated);
    setIsTimePickerOpen(false);
    syncUserSettingToGAS(userId, 'reminder_time', time);
  };

  const handleChangeLang = (newLang: Language) => {
    if (newLang === lang) return;
    onHapticSelection?.();
    try {
      window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    } catch (_) {}
    setLang(newLang);
    syncUserLangToGAS(userId, newLang);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ios-bg overflow-y-auto animate-fadeIn select-none">
      {/* Fixed iOS Top Navigation Bar with dissolving gradient */}
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, var(--ios-bg) 0%, var(--ios-bg) 75%, transparent 100%)',
            height: 'calc(100% + 24px)',
          }}
        />

        <div className="w-full max-w-lg mx-auto px-4 pt-[max(calc(env(safe-area-inset-top,0px)+44px),56px)] pb-3 flex items-center justify-center relative z-10 pointer-events-auto">
          {/* Centered title */}
          <h1 className="text-[20px] font-bold text-ios-text tracking-tight text-center">
            {t.settingsTitle}
          </h1>
        </div>
      </header>

      {/* Main Settings Content */}
      <div className="w-full max-w-lg mx-auto px-4 pt-[max(calc(env(safe-area-inset-top,0px)+104px),116px)] pb-32 space-y-6">
        {/* Category 1: Напоминания (Reminders) */}
        <div>
          <h2 className="text-[13px] font-semibold text-ios-textSecondary uppercase tracking-wider px-3 mb-2">
            {t.remindersCategory}
          </h2>

          <div className="rounded-ios bg-ios-card shadow-ios-card dark:shadow-ios-card-dark overflow-hidden p-0 divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {/* Row 1: Выходы (Shifts reminder) */}
            <div
              onClick={() => {
                // If user clicks the row, open time selector
                onHapticImpact?.('light');
                setIsTimePickerOpen(true);
              }}
              className="py-3 px-4 flex items-center justify-between gap-3.5 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:bg-black/[0.04] dark:active:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-ios-accent">
                  <SFSymbol
                    src="/symbols/SVG_Vector/03_shifts_bell.svg"
                    className="w-7 h-7 text-ios-accent"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-semibold text-ios-text tracking-tight">
                      {t.remindersShifts}
                    </span>
                    {/* Active time badge clickable button */}
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-0.5 rounded-full bg-ios-item-bg text-ios-accent">
                      <span>{settings.reminder_time}</span>
                      <SFSymbol
                        src="/symbols/SVG_Vector/15_back_chevron.svg"
                        className="w-2.5 h-2.5 rotate-180 text-ios-accent"
                      />
                    </span>
                  </div>
                  <p className="text-[12px] text-ios-textSecondary truncate mt-0.5">
                    {t.remindersShiftsDesc}
                  </p>
                </div>
              </div>

              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center flex-shrink-0"
              >
                <IOSSwitch
                  checked={settings.sub_reminders}
                  onChange={() => handleToggle('sub_reminders')}
                  onHaptic={onHapticImpact}
                  aria-label={t.remindersShifts}
                />
              </div>
            </div>

            {/* Row 2: Зарядка (Charges reminder) */}
            <div className="py-3 px-4 flex items-center justify-between gap-3.5">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-ios-accent">
                  <SFSymbol
                    src="/symbols/SVG_Vector/01_charge_bolt.svg"
                    className="w-7 h-7 text-ios-accent"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[16px] font-semibold text-ios-text tracking-tight block">
                    {t.remindersCharges}
                  </span>
                  <p className="text-[12px] text-ios-textSecondary truncate mt-0.5">
                    {t.remindersChargesDesc}
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-shrink-0">
                <IOSSwitch
                  checked={settings.sub_charge}
                  onChange={() => handleToggle('sub_charge')}
                  onHaptic={onHapticImpact}
                  aria-label={t.remindersCharges}
                />
              </div>
            </div>

            {/* Row 3: Генеральная уборка (GU) */}
            <div className="py-3 px-4 flex items-center justify-between gap-3.5">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-ios-accent">
                  <SFSymbol
                    src="/symbols/SVG_Vector/05_cleaning_soap_bubbles.svg"
                    className="w-7 h-7 text-ios-accent"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[16px] font-semibold text-ios-text tracking-tight block">
                    {t.remindersGU}
                  </span>
                  <p className="text-[12px] text-ios-textSecondary truncate mt-0.5">
                    {t.remindersGUDesc}
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-shrink-0">
                <IOSSwitch
                  checked={settings.sub_gu}
                  onChange={() => handleToggle('sub_gu')}
                  onHaptic={onHapticImpact}
                  aria-label={t.remindersGU}
                />
              </div>
            </div>

            {/* Row 4: График работы (Schedule reminder) */}
            <div className="py-3 px-4 flex items-center justify-between gap-3.5">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-ios-accent">
                  <SFSymbol
                    src="/symbols/SVG_Vector/07_schedule_calendar.svg"
                    className="w-7 h-7 text-ios-accent"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[16px] font-semibold text-ios-text tracking-tight block">
                    {t.remindersSchedule}
                  </span>
                  <p className="text-[12px] text-ios-textSecondary truncate mt-0.5">
                    {t.remindersScheduleDesc}
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-shrink-0">
                <IOSSwitch
                  checked={settings.sub_schedule}
                  onChange={() => handleToggle('sub_schedule')}
                  onHaptic={onHapticImpact}
                  aria-label={t.remindersSchedule}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category 2: Настройки приложения (App Settings) */}
        <div>
          <h2 className="text-[13px] font-semibold text-ios-textSecondary uppercase tracking-wider px-3 mb-2">
            {t.appSettingsCategory}
          </h2>

          <div className="rounded-ios bg-ios-card shadow-ios-card dark:shadow-ios-card-dark overflow-hidden p-0">
            {/* Row 1: Язык интерфейса */}
            <div className="py-3 px-4 flex items-center justify-between gap-3.5">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-ios-accent">
                  <SFSymbol
                    src="/symbols/SVG_Vector/09_language_globe.svg"
                    className="w-7 h-7 text-ios-accent"
                  />
                </div>
                <span className="text-[16px] font-semibold text-ios-text tracking-tight">
                  {t.appLanguage}
                </span>
              </div>

              {/* Segmented language control */}
              <div className="flex items-center p-1 rounded-full bg-ios-item-bg">
                <button
                  type="button"
                  onClick={() => handleChangeLang('uk')}
                  className={clsx(
                    'py-1 px-3 rounded-full text-[13px] font-semibold transition-all duration-200',
                    lang === 'uk'
                      ? 'bg-ios-accent text-white shadow-sm scale-[1.02]'
                      : 'text-ios-textSecondary hover:text-ios-text'
                  )}
                >
                  UA
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeLang('ru')}
                  className={clsx(
                    'py-1 px-3 rounded-full text-[13px] font-semibold transition-all duration-200',
                    lang === 'ru'
                      ? 'bg-ios-accent text-white shadow-sm scale-[1.02]'
                      : 'text-ios-textSecondary hover:text-ios-text'
                  )}
                >
                  RU
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reminder Time Selection Sheet / Modal */}
      {isTimePickerOpen && (
        <div
          onClick={() => setIsTimePickerOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-[28px] sm:rounded-[28px] bg-ios-card shadow-2xl p-5 space-y-4 animate-slideUp"
          >
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <SFSymbol
                  src="/symbols/SVG_Vector/36_admin_reminder_time.svg"
                  className="w-5 h-5 text-ios-accent"
                />
                <h3 className="text-[18px] font-bold text-ios-text tracking-tight">
                  {t.reminderTimeTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTimePickerOpen(false)}
                className="w-8 h-8 rounded-full bg-ios-item-bg flex items-center justify-center text-ios-textSecondary active:scale-90 transition-transform"
              >
                <SFSymbol
                  src="/symbols/SVG_Vector/12_close_xmark.svg"
                  className="w-4 h-4 text-ios-textSecondary"
                />
              </button>
            </div>

            <p className="text-[13px] text-ios-textSecondary leading-snug">
              {t.selectReminderTime}
            </p>

            <div className="space-y-2 pt-1">
              {REMINDER_TIME_OPTIONS.map(({ time, isDefault }) => {
                const isSelected = settings.reminder_time === time;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleSelectTime(time)}
                    className={clsx(
                      'w-full py-3 px-4 rounded-2xl flex items-center justify-between transition-all duration-200 active:scale-[0.98]',
                      isSelected
                        ? 'bg-ios-accent/15 text-ios-accent font-bold'
                        : 'bg-ios-item-bg text-ios-text hover:bg-ios-item-hover'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[17px] tracking-tight">{time}</span>
                      {isDefault && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-ios-accent/20 text-ios-accent">
                          {lang === 'uk' ? 'За замовчуванням' : 'По умолчанию'}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-ios-accent flex items-center justify-center text-white shadow-sm">
                        <span className="text-white text-[13px] font-bold">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
