import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { SFSymbol } from '../components/SFSymbol';
import { AnimatedClock } from '../components/AnimatedClock';
import { useI18n } from '../context/I18nContext';
import { getFirstName } from '../utils/name';
import { CHARGE_DAYS_MAP, DEVICES } from '../constants/devices';
import { getWeekId } from '../utils/date';
import { getLocalCharges, toggleChargeGAS, chargeAllGAS } from '../services/api';
import { triggerSideCannonsConfetti } from '../utils/confetti';
import type { DeviceKey } from '../types';

interface HomePageProps {
  userName?: string;
  onNavigateToSchedule: () => void;
  chargesCount: { charged: number; total: number };
  onHapticImpact?: (style?: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  onHapticSuccess?: () => void;
  onOpenSettings?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  userName,
  onNavigateToSchedule,
  chargesCount: _initialChargesCount,
  onHapticImpact,
  onHapticSuccess,
  onOpenSettings,
}) => {
  const { lang, t } = useI18n();
  const firstName = getFirstName(userName, lang);
  const displayName = firstName || t.defaultUserName;

  const anchorRef = useRef<HTMLDivElement>(null);
  const heroTargetRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const headerBgRef = useRef<HTMLDivElement>(null);

  // Today dates & week id
  const today = useMemo(() => new Date(), []);
  const dayOfWeek = today.getDay();
  const weekId = useMemo(() => getWeekId(today), [today]);

  // Local charges state synced with localStorage
  const [charges, setCharges] = useState<Record<string, boolean>>(() => getLocalCharges(weekId));

  // Auto-sync charges when returning to app or switching tabs
  useEffect(() => {
    const sync = () => {
      const local = getLocalCharges(weekId);
      if (local && Object.keys(local).length > 0) {
        setCharges((prev) => ({ ...prev, ...local }));
      }
    };
    window.addEventListener('focus', sync);
    window.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('visibilitychange', sync);
    };
  }, [weekId]);

  // Sunday audit uncharged items calculation
  const sundayUncharged = useMemo(() => {
    if (dayOfWeek !== 0) return [];
    const uncharged: DeviceKey[] = [];
    for (let d = 1; d <= 6; d++) {
      const items = CHARGE_DAYS_MAP[d] || [];
      for (const item of items) {
        if (!charges[`CHG_${weekId}_${item}`] && !uncharged.includes(item)) {
          uncharged.push(item);
        }
      }
    }
    return uncharged;
  }, [charges, dayOfWeek, weekId]);

  // Items for today
  const todayItems: { key: DeviceKey; isSundayDebt: boolean }[] = useMemo(() => {
    const regular = (CHARGE_DAYS_MAP[dayOfWeek] || []).map((k) => ({
      key: k,
      isSundayDebt: false,
    }));
    if (dayOfWeek === 0 && sundayUncharged.length > 0) {
      sundayUncharged.forEach((k) => {
        if (!regular.some((r) => r.key === k)) {
          regular.push({ key: k, isSundayDebt: true });
        }
      });
    }
    return regular;
  }, [dayOfWeek, sundayUncharged]);

  const totalCount = todayItems.length;
  const chargedCount = todayItems.filter(
    (i) => charges[`CHG_${weekId}_${i.key}`]
  ).length;
  const isAllCharged = totalCount > 0 && chargedCount === totalCount;

  // Confetti trigger on 100% completion
  const userInteractedRef = useRef<boolean>(false);
  const prevAllChargedRef = useRef<boolean>(isAllCharged);

  useEffect(() => {
    if (userInteractedRef.current && !prevAllChargedRef.current && isAllCharged && totalCount > 0) {
      triggerSideCannonsConfetti();
      onHapticSuccess?.();
      try {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      } catch (_) {}
    }
    prevAllChargedRef.current = isAllCharged;
  }, [isAllCharged, totalCount, onHapticSuccess]);

  const handleToggleDevice = (deviceKey: DeviceKey) => {
    userInteractedRef.current = true;
    onHapticImpact?.('medium');
    const fullKey = `CHG_${weekId}_${deviceKey}`;
    const newStatus = !charges[fullKey];

    // Optimistic UI with clean deletion when unchecking
    setCharges((prev) => {
      const updated = { ...prev };
      if (newStatus) {
        updated[fullKey] = true;
      } else {
        delete updated[fullKey];
      }
      return updated;
    });

    if (newStatus) {
      onHapticSuccess?.();
      try {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      } catch (_) {}
    } else {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
      } catch (_) {}
    }

    toggleChargeGAS(weekId, deviceKey, newStatus).catch(() => {});
  };

  const handleChargeAll = () => {
    userInteractedRef.current = true;
    onHapticSuccess?.();
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch (_) {}

    const items = todayItems.map((i) => i.key);

    setCharges((prev) => {
      const updated = { ...prev };
      items.forEach((k) => {
        updated[`CHG_${weekId}_${k}`] = true;
      });
      return updated;
    });

    chargeAllGAS(weekId, items).catch(() => {});
  };

  // Initial estimate: 96px icon centered horizontally, ~110px below header
  const coordsRef = useRef({
    x: typeof window !== 'undefined' ? Math.min(window.innerWidth, 512) / 2 - 32 : 160,
    y: 110,
    scale: 3.0,
  });

  // Smooth continuous animation driver based on scroll position
  const updateAnimation = useCallback(() => {
    const scrollY =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      window.pageYOffset ||
      0;

    // Transition completes within ~85px of scroll
    const threshold = 85;
    const p = Math.min(1, Math.max(0, scrollY / threshold));

    const { x: dx, y: dy, scale } = coordsRef.current;

    // Silk smoothstep curve: 3p^2 - 2p^3
    const ease = p * p * (3 - 2 * p);

    const curX = dx * (1 - ease);
    const curY = dy * (1 - ease);
    const curScale = 1 + (scale - 1) * (1 - ease);

    if (clockRef.current) {
      clockRef.current.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0) scale(${curScale.toFixed(3)})`;
    }

    if (titleRef.current) {
      titleRef.current.style.opacity = ease.toFixed(3);
      titleRef.current.style.transform = `translateX(${(-12 * (1 - ease)).toFixed(2)}px) scale(${(0.94 + 0.06 * ease).toFixed(3)})`;
      titleRef.current.style.pointerEvents = ease > 0.5 ? 'auto' : 'none';
    }

    if (headerBgRef.current) {
      headerBgRef.current.style.opacity = ease.toFixed(3);
    }
  }, []);

  const calculateCoords = useCallback(() => {
    if (!anchorRef.current || !heroTargetRef.current) return;
    const anchor = anchorRef.current;
    const hero = heroTargetRef.current;

    const anchorRect = anchor.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    const scrollY =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      window.pageYOffset ||
      0;

    const anchorCenterX = anchorRect.left + anchorRect.width / 2;
    const heroCenterX = heroRect.left + heroRect.width / 2;
    const dx = heroCenterX - anchorCenterX;

    const anchorCenterY = anchorRect.top + anchorRect.height / 2;
    const heroCenterY = heroRect.top + heroRect.height / 2;
    // Current scroll offset restores the original resting document Y
    const dy = (heroCenterY + scrollY) - anchorCenterY;

    const scale = (heroRect.width || 96) / (anchorRect.width || 32);

    coordsRef.current = { x: dx, y: dy, scale: scale || 3.0 };

    updateAnimation();
  }, [updateAnimation]);

  useLayoutEffect(() => {
    calculateCoords();
  }, [calculateCoords]);

  useEffect(() => {
    calculateCoords();
    const rafId = requestAnimationFrame(calculateCoords);
    const t1 = setTimeout(calculateCoords, 60);
    const t2 = setTimeout(calculateCoords, 180);

    let scrollRaf: number | null = null;
    const onScroll = () => {
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(updateAnimation);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchmove', onScroll, { passive: true });
    window.addEventListener('resize', calculateCoords);
    window.addEventListener('orientationchange', calculateCoords);

    onScroll();

    return () => {
      cancelAnimationFrame(rafId);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchmove', onScroll);
      window.removeEventListener('resize', calculateCoords);
      window.removeEventListener('orientationchange', calculateCoords);
    };
  }, [calculateCoords, updateAnimation]);

  return (
    <>
      {/* Fixed Top Navigation Bar - strictly outside any transformed container to lock to viewport */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full pointer-events-none">
        {/* Dissolving gradient background: soft fade downward, no flat stripe, no harsh border */}
        <div
          ref={headerBgRef}
          className="absolute inset-0 pointer-events-none transition-opacity duration-200"
          style={{
            opacity: 0,
            background:
              'linear-gradient(to bottom, var(--ios-bg) 0%, var(--ios-bg) 65%, transparent 100%)',
            height: 'calc(100% + 32px)',
          }}
        />

        <div className="w-full max-w-lg mx-auto px-4 pt-[max(calc(env(safe-area-inset-top,0px)+76px),88px)] pb-3 flex items-center justify-between h-[max(calc(env(safe-area-inset-top,0px)+128px),140px)] relative z-10 pointer-events-auto">
          {/* Left group: Clock Anchor & smooth reappearing Title */}
          <div className="flex items-center gap-2.5">
            <div ref={anchorRef} className="w-8 h-8 relative flex-shrink-0">
              <div
                ref={clockRef}
                className="w-8 h-8 origin-center pointer-events-none transition-transform duration-75 ease-out"
                style={{
                  transform: `translate3d(${coordsRef.current.x}px, ${coordsRef.current.y}px, 0) scale(${coordsRef.current.scale})`,
                }}
              >
                <AnimatedClock className="w-8 h-8 text-ios-red" />
              </div>
            </div>

            <h1
              ref={titleRef}
              className="text-[28px] sm:text-[32px] font-bold text-ios-text tracking-tight leading-none origin-left transition-all duration-100 ease-out"
              style={{
                opacity: 0,
                transform: 'translateX(-12px) scale(0.94)',
                pointerEvents: 'none',
              }}
            >
              {t.appTitle}
            </h1>
          </div>

          {/* Right group: Settings button */}
          <button
            type="button"
            onClick={() => {
              onHapticImpact?.('light');
              onOpenSettings?.();
            }}
            aria-label="Settings"
            className="w-8 h-8 flex items-center justify-center text-ios-text active:scale-90 active:opacity-60 transition-all flex-shrink-0"
          >
            <SFSymbol
              src="/symbols/SVG_Vector/11_settings_gear.svg"
              className="w-8 h-8 text-ios-text"
            />
          </button>
        </div>
      </header>

      {/* Main Page Body: scrollable content with animation ONLY on the content, NOT on fixed header */}
      <div
        className="w-full max-w-lg mx-auto animate-fadeIn px-4 pt-10 sm:pt-14 pb-56 space-y-8"
        style={{ minHeight: 'calc(100dvh + 280px)' }}
      >
        {/* Spacer for fixed header row */}
        <div className="w-full h-11 pointer-events-none" />

        {/* Centered Hero Section with large 96px icon and spacious top margin */}
        <div className="pt-2 pb-2 flex flex-col items-center text-center">
          {/* Spatial target placeholder: 96px by 96px with generous margin */}
          <div
            ref={heroTargetRef}
            className="w-24 h-24 flex items-center justify-center pointer-events-none"
          />

          {/* Greeting text with increased top margin from the icon */}
          <h2 className="mt-5 sm:mt-6 text-[28px] sm:text-[32px] font-bold text-ios-text tracking-tight leading-[1.18] max-w-sm">
            {t.todayTasksGreeting(displayName)}
          </h2>
        </div>

        {/* Redesigned Today Charges Widget */}
        <div className="rounded-ios bg-ios-card shadow-ios-card dark:shadow-ios-card-dark p-5 transition-all">
          {/* Widget Header: Tab icon + Title "График зарядок" on left, chevron on right */}
          <div
            onClick={onNavigateToSchedule}
            className="flex items-center justify-between cursor-pointer group select-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-ios-accent/15 text-ios-accent flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <SFSymbol
                  src="/symbols/SVG_Vector/01_charge_bolt.svg"
                  className="w-8 h-8 text-ios-accent"
                />
              </div>
              <h3 className="text-[18px] font-bold text-ios-text group-hover:text-ios-accent transition-colors leading-tight">
                {t.chargesWidgetTitle}
              </h3>
            </div>

            <button
              type="button"
              className="w-9 h-9 rounded-full flex items-center justify-center text-ios-textSecondary group-hover:text-ios-text group-hover:translate-x-0.5 transition-all"
              aria-label={t.tabSchedule}
            >
              <SFSymbol
                src="/symbols/SVG_Vector/15_back_chevron.svg"
                className="w-4.5 h-4.5 text-ios-textSecondary rotate-180"
              />
            </button>
          </div>

          {/* Progress bar under the category title with tight margin */}
          {totalCount > 0 && (
            <div className="mt-3 w-full h-1.5 rounded-full bg-ios-progressTrack overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full transition-all duration-300",
                  isAllCharged ? "bg-ios-green" : "bg-ios-accent"
                )}
                style={{
                  width: `${Math.round((chargedCount / totalCount) * 100)}%`,
                }}
              />
            </div>
          )}

          {/* Miniature version of the Device Checklist (clean, without subtitles, small gap) */}
          {totalCount > 0 && (
            <div className="mt-2 divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {todayItems.map(({ key, isSundayDebt }) => {
                const device = DEVICES[key];
                if (!device) return null;
                const isCharged = !!charges[`CHG_${weekId}_${key}`];
                const deviceName = lang === 'uk' ? device.nameUk : device.nameRu;

                return (
                  <div
                    key={key}
                    onClick={() => handleToggleDevice(key)}
                    className={clsx(
                      "py-2.5 px-1 flex items-center justify-between gap-3 cursor-pointer group/item transition-all duration-200 active:scale-[0.98]",
                      isCharged ? "opacity-75" : ""
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-ios-item-bg flex items-center justify-center flex-shrink-0">
                        <SFSymbol
                          src={device.symbolSvg}
                          fallbackPng={device.symbolPngWhite}
                          className={clsx(
                            "w-5 h-5 transition-colors",
                            isCharged ? "text-ios-green" : isSundayDebt ? "text-ios-red" : "text-ios-text"
                          )}
                          alt={deviceName}
                        />
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={clsx(
                            "text-[15px] font-medium truncate tracking-tight transition-all",
                            isCharged ? "text-ios-text line-through opacity-65" : "text-ios-text"
                          )}
                        >
                          {deviceName}
                        </span>
                        {isSundayDebt && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-ios-red/20 text-ios-red flex-shrink-0">
                            {t.debtBadge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* iOS Checkbox Button: Apple Reminders circle-in-circle style (same as in full Schedule tab) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleDevice(key);
                      }}
                      className={clsx(
                        "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 border-2",
                        isCharged
                          ? "border-ios-green shadow-glow-green scale-105"
                          : "border-black/20 dark:border-white/25 hover:border-ios-green/50 bg-transparent"
                      )}
                      aria-label={isCharged ? t.chargedStatus : t.pendingStatus}
                    >
                      <span
                        className={clsx(
                          "w-3.5 h-3.5 rounded-full bg-ios-green transition-all duration-200 ease-out",
                          isCharged ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        )}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action button: "Все заряжено" or Celebration state */}
          {totalCount > 0 && !isAllCharged && (
            <div className="mt-3.5 pt-1">
              <button
                type="button"
                onClick={handleChargeAll}
                className="w-full py-3 rounded-2xl bg-ios-accent hover:opacity-90 active:scale-[0.98] text-white font-semibold text-[15px] shadow-glow-accent flex items-center justify-center gap-2 transition-all"
              >
                <SFSymbol
                  src="/symbols/SVG_Vector/37_status_all_charged.svg"
                  className="w-5 h-5 text-white"
                />
                <span>{t.allChargedBtn}</span>
              </button>
            </div>
          )}

          {/* Celebration status when all charged */}
          {isAllCharged && totalCount > 0 && (
            <div
              onClick={() => {
                triggerSideCannonsConfetti();
                onHapticSuccess?.();
                try {
                  window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
                } catch (_) {}
              }}
              className="mt-3.5 py-3 px-4 rounded-2xl bg-ios-green/10 text-ios-green flex items-center justify-center gap-2 font-semibold text-[14px] cursor-pointer active:scale-[0.98] transition-all select-none"
              title="🎉"
            >
              <SFSymbol
                src="/symbols/SVG_Vector/41_battery_100.svg"
                className="w-6 h-4 text-ios-green"
              />
              <span>{t.allChargedOnToday}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
