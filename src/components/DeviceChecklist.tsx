import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';
import type { DayInfo, DeviceKey } from '../types';
import { DEVICES } from '../constants/devices';
import { SFSymbol } from './SFSymbol';
import { triggerSideCannonsConfetti } from '../utils/confetti';
import { useI18n } from '../context/I18nContext';

interface DeviceChecklistProps {
  day: DayInfo;
  charges: Record<string, boolean>;
  onToggleDevice: (deviceKey: DeviceKey) => void;
  onChargeAll: () => void;
  sundayUnchargedItems?: DeviceKey[];
}

export const DeviceChecklist: React.FC<DeviceChecklistProps> = ({
  day,
  charges,
  onToggleDevice,
  onChargeAll,
  sundayUnchargedItems = [],
}) => {
  const { lang, t } = useI18n();
  const isSunday = day.dayOfWeek === 0;

  // For Sunday, include Sunday items + any uncharged items of the week
  const itemsToDisplay: { key: DeviceKey; isSundayDebt?: boolean }[] = [
    ...day.deviceKeys.map((k) => ({ key: k, isSundayDebt: false })),
  ];

  if (isSunday && sundayUnchargedItems.length > 0) {
    sundayUnchargedItems.forEach((k) => {
      if (!itemsToDisplay.some((i) => i.key === k)) {
        itemsToDisplay.push({ key: k, isSundayDebt: true });
      }
    });
  }

  // Statistics
  const totalCount = itemsToDisplay.length;
  const chargedCount = itemsToDisplay.filter(
    (i) => charges[`CHG_${day.weekId}_${i.key}`]
  ).length;
  const isAllCharged = totalCount > 0 && chargedCount === totalCount;

  // 2D side-cannon confetti on reaching 100%
  const userInteractedRef = useRef<boolean>(false);
  const prevAllChargedRef = useRef<boolean>(isAllCharged);
  const currentDayRef = useRef<string>(day.isoDate);

  // Reset interaction and state if day changes
  if (currentDayRef.current !== day.isoDate) {
    currentDayRef.current = day.isoDate;
    prevAllChargedRef.current = isAllCharged;
    userInteractedRef.current = false;
  }

  useEffect(() => {
    if (userInteractedRef.current && !prevAllChargedRef.current && isAllCharged && totalCount > 0) {
      triggerSideCannonsConfetti();
      try {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      } catch (_) {}
    }
    prevAllChargedRef.current = isAllCharged;
  }, [isAllCharged, totalCount]);

  const handleDeviceClick = (key: DeviceKey) => {
    userInteractedRef.current = true;
    onToggleDevice(key);
  };

  const handleChargeAllClick = () => {
    userInteractedRef.current = true;
    onChargeAll();
  };

  return (
    <div className="w-full space-y-4">


      {/* Sunday Alert Banner if there are uncharged devices */}
      {isSunday && sundayUnchargedItems.length > 0 && (
        <div className="p-3.5 rounded-ios-sm bg-ios-red/10 text-ios-red flex items-start gap-3">
          <SFSymbol
            src="/symbols/SVG_Vector/40_warn_none_charged.svg"
            className="w-6 h-6 flex-shrink-0 mt-0.5 text-ios-red"
          />
          <div className="text-[13px] leading-snug">
            <span className="font-semibold block mb-0.5">{t.sundayAuditTitle}</span>
            {t.sundayAuditDesc}
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-2">
        {itemsToDisplay.map(({ key, isSundayDebt }) => {
          const device = DEVICES[key];
          if (!device) return null;

          const isCharged = !!charges[`CHG_${day.weekId}_${key}`];
          const deviceName = lang === 'uk' ? device.nameUk : device.nameRu;

          return (
            <div
              key={key}
              onClick={() => handleDeviceClick(key)}
              className={clsx(
                'group p-3.5 rounded-ios bg-ios-card transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 active:scale-[0.98]',
                isCharged
                  ? 'bg-ios-green/[0.04]'
                  : isSundayDebt
                  ? 'bg-ios-red/[0.04]'
                  : 'hover:bg-ios-cardSubtle'
              )}
            >
              {/* Device Icon + Name */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <SFSymbol
                    src={device.symbolSvg}
                    fallbackPng={device.symbolPngWhite}
                    className={clsx(
                      'w-10 h-10 transition-colors',
                      isCharged
                        ? 'text-ios-green'
                        : isSundayDebt
                        ? 'text-ios-red'
                        : 'text-ios-text'
                    )}
                    alt={deviceName}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={clsx(
                        'text-[15px] font-semibold truncate tracking-tight',
                        isCharged ? 'text-ios-text line-through opacity-80' : 'text-ios-text'
                      )}
                    >
                      {deviceName}
                    </span>
                    {isSundayDebt && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-ios-red/20 text-ios-red">
                        {t.debtBadge}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px]">
                    <span className={isCharged ? 'text-ios-green font-medium' : 'text-ios-textSecondary'}>
                      {isCharged ? t.chargedStatus : t.pendingStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* iOS Checkbox Button: Apple Reminders circle-in-circle style */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeviceClick(key);
                }}
                className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 border-2',
                  isCharged
                    ? 'border-ios-green shadow-glow-green scale-105'
                    : 'border-black/20 dark:border-white/25 hover:border-ios-green/50 bg-transparent'
                )}
                aria-label={isCharged ? t.chargedStatus : t.pendingStatus}
              >
                <span
                  className={clsx(
                    'w-3.5 h-3.5 rounded-full bg-ios-green transition-all duration-200 ease-out',
                    isCharged ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Action button: compact centered pill */}
      {totalCount > 0 && !isAllCharged && (
        <div className="pt-3 pb-1 flex justify-center">
          <button
            onClick={handleChargeAllClick}
            className="px-7 py-3 rounded-full bg-ios-accent hover:opacity-90 active:scale-[0.98] text-white font-semibold text-[15px] shadow-glow-accent flex items-center justify-center gap-2.5 transition-all"
          >
            <SFSymbol
              src="/symbols/SVG_Vector/37_status_all_charged.svg"
              className="w-5 h-5 text-white"
            />
            <span>{t.allChargedBtn}</span>
          </button>
        </div>
      )}

      {/* When all charged: grey charged battery icon and label */}
      {isAllCharged && totalCount > 0 && (
        <div
          onClick={() => {
            triggerSideCannonsConfetti();
            try {
              window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
            } catch (_) {}
          }}
          className="py-6 flex flex-col items-center justify-center text-center animate-fadeIn cursor-pointer active:scale-95 transition-transform select-none"
          title="🎉"
        >
          <SFSymbol
            src="/symbols/SVG_Vector/41_battery_100.svg"
            className="w-20 h-12 text-ios-textSecondary mb-2.5"
            alt={t.allChargedOnToday}
          />
          <span className="text-[16px] font-semibold text-ios-textSecondary">
            {t.allChargedOnToday}
          </span>
        </div>
      )}
    </div>
  );
};
