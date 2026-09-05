import React, { useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { SFSymbol } from '../components/SFSymbol';
import { AnimatedClock } from '../components/AnimatedClock';
import { useI18n } from '../context/I18nContext';
import { getFirstName } from '../utils/name';
import { CHARGE_DAYS_MAP, DEVICES } from '../constants/devices';

interface HomePageProps {
  userName?: string;
  onNavigateToSchedule: () => void;
  chargesCount: { charged: number; total: number };
}

export const HomePage: React.FC<HomePageProps> = ({
  userName,
  onNavigateToSchedule,
  chargesCount,
}) => {
  const { lang, t } = useI18n();
  const firstName = getFirstName(userName, lang);
  const displayName = firstName || t.defaultUserName;

  const anchorRef = useRef<HTMLDivElement>(null);
  const heroTargetRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const headerBgRef = useRef<HTMLDivElement>(null);

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

  // Today's scheduled devices
  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayKeys = CHARGE_DAYS_MAP[dayOfWeek] || [];

  return (
    <div
      className="w-full max-w-lg mx-auto animate-fadeIn"
      style={{ minHeight: 'calc(100dvh + 280px)' }}
    >
      {/* Fixed Top Navigation Bar - stays permanently visible when scrolling */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full pointer-events-none">
        {/* Dissolving gradient background: soft fade downward, no flat stripe, no harsh border */}
        <div
          ref={headerBgRef}
          className="absolute inset-0 -bottom-10 pointer-events-none transition-opacity duration-200"
          style={{
            opacity: 0,
            background:
              'linear-gradient(to bottom, var(--ios-bg) 0%, var(--ios-bg) 62%, transparent 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            maskImage:
              'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
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

          {/* Right group: User profile initial circle */}
          <div className="w-11 h-11 rounded-full bg-ios-accent/15 flex items-center justify-center text-ios-accent font-bold text-[16px] shadow-sm flex-shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Page Body: includes header space offset, then generous top and inter-element spacing */}
      <div className="px-4 pt-10 sm:pt-14 pb-56 space-y-8">
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

        {/* Quick Widget: Charges Today */}
        <div
          onClick={onNavigateToSchedule}
          className="p-5 rounded-ios bg-ios-card shadow-ios-card dark:shadow-ios-card-dark cursor-pointer active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-ios-accent/15 text-ios-accent flex items-center justify-center flex-shrink-0">
                <SFSymbol
                  src="/symbols/SVG_Vector/01_charge_bolt.svg"
                  className="w-7 h-7 text-ios-accent"
                />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold text-ios-text group-hover:text-ios-accent transition-colors text-left">
                  {t.chargesWidgetTitle}
                </h3>
                <p className="text-[13px] text-ios-textSecondary text-left">
                  {chargesCount.total > 0
                    ? t.chargesCountToday(chargesCount.charged, chargesCount.total)
                    : t.checkDevices}
                </p>
              </div>
            </div>

            <SFSymbol
              src="/symbols/SVG_Vector/15_back_chevron.svg"
              className="w-5 h-5 text-ios-textSecondary rotate-180 group-hover:translate-x-0.5 transition-transform"
            />
          </div>

          {/* Progress bar */}
          {chargesCount.total > 0 && (
            <div className="w-full h-1.5 rounded-full bg-ios-item-bg overflow-hidden">
              <div
                className="h-full rounded-full bg-ios-accent transition-all duration-300"
                style={{
                  width: `${Math.round(
                    (chargesCount.charged / chargesCount.total) * 100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Today's Tasks Device Cards (provides genuine scrollable content and task preview) */}
        {todayKeys.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[13px] font-semibold text-ios-textSecondary uppercase tracking-wider">
                {lang === 'uk' ? 'Пристрої на сьогодні' : 'Устройства на сегодня'}
              </h3>
              <span className="text-[13px] font-medium text-ios-textSecondary">
                {chargesCount.charged} / {chargesCount.total}
              </span>
            </div>

            <div className="bg-ios-card rounded-ios shadow-ios-card dark:shadow-ios-card-dark divide-y divide-black/[0.04] dark:divide-white/[0.04] overflow-hidden">
              {todayKeys.map((key) => {
                const dev = DEVICES[key];
                if (!dev) return null;
                const name = lang === 'uk' ? dev.nameUk : dev.nameRu;
                return (
                  <div
                    key={key}
                    onClick={onNavigateToSchedule}
                    className="flex items-center justify-between p-4 cursor-pointer active:bg-ios-item-hover transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-ios-item-bg flex items-center justify-center flex-shrink-0">
                        <SFSymbol src={dev.symbolSvg} className="w-5 h-5 text-ios-accent" />
                      </div>
                      <div>
                        <div className="text-[16px] font-medium text-ios-text">{name}</div>
                        <div className="text-[12px] text-ios-textSecondary">{dev.category}</div>
                      </div>
                    </div>
                    <SFSymbol
                      src="/symbols/SVG_Vector/15_back_chevron.svg"
                      className="w-4 h-4 text-ios-textSecondary rotate-180 opacity-60"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
