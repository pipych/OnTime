import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import clsx from 'clsx';
import { SFSymbol } from '../components/SFSymbol';
import { AnimatedClock } from '../components/AnimatedClock';
import { useI18n } from '../context/I18nContext';
import { getFirstName } from '../utils/name';

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

  const [isScrolled, setIsScrolled] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const heroTargetRef = useRef<HTMLDivElement>(null);

  // Initial estimate so it renders centered immediately on first frame before measurement
  const [coords, setCoords] = useState(() => {
    if (typeof window === 'undefined') return { x: 160, y: 64, scale: 2.25 };
    const screenW = Math.min(window.innerWidth, 512);
    const dx = screenW / 2 - 32;
    return { x: dx, y: 64, scale: 2.25 };
  });

  const calculateCoords = useCallback(() => {
    if (!anchorRef.current || !heroTargetRef.current) return;
    const anchor = anchorRef.current;
    const hero = heroTargetRef.current;

    const anchorRect = anchor.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    const currentScroll = window.scrollY || document.documentElement.scrollTop || 0;

    const anchorCenterX = anchorRect.left + anchorRect.width / 2;
    const heroCenterX = heroRect.left + heroRect.width / 2;
    const dx = heroCenterX - anchorCenterX;

    const anchorCenterY = anchorRect.top + anchorRect.height / 2;
    const heroCenterY = heroRect.top + heroRect.height / 2;
    const dy = (heroCenterY + currentScroll) - anchorCenterY;

    const scale = (heroRect.width || 72) / (anchorRect.width || 32);

    setCoords({ x: dx, y: dy, scale });
  }, []);

  useLayoutEffect(() => {
    calculateCoords();
  }, [calculateCoords]);

  useEffect(() => {
    calculateCoords();
    const rafId = requestAnimationFrame(calculateCoords);
    const timer = setTimeout(calculateCoords, 100);

    const handleScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      setIsScrolled((prev) => {
        if (!prev && y > 14) return true;
        if (prev && y <= 4) return false;
        return prev;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', calculateCoords);
    window.addEventListener('orientationchange', calculateCoords);

    handleScroll();

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', calculateCoords);
      window.removeEventListener('orientationchange', calculateCoords);
    };
  }, [calculateCoords]);

  return (
    <div className="w-full max-w-lg mx-auto min-h-[calc(100dvh+120px)] animate-fadeIn">
      {/* Sticky Top Navigation Bar */}
      <header
        className={clsx(
          "sticky top-[max(calc(env(safe-area-inset-top,0px)+76px),88px)] z-35",
          "w-full px-4 py-2 transition-all duration-300",
          isScrolled
            ? "bg-ios-bg/90 backdrop-blur-md border-b border-black/[0.05] dark:border-white/[0.05] shadow-sm"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="flex items-center justify-between h-11 relative">
          {/* Left group: Clock Anchor & smooth reappearing Title */}
          <div className="flex items-center gap-2.5">
            <div ref={anchorRef} className="w-8 h-8 relative flex-shrink-0">
              <div
                className="w-8 h-8 origin-center transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                style={{
                  transform: isScrolled
                    ? 'translate3d(0, 0, 0) scale(1)'
                    : `translate3d(${coords.x}px, ${coords.y}px, 0) scale(${coords.scale})`,
                }}
              >
                <AnimatedClock className="w-8 h-8 text-ios-red" />
              </div>
            </div>

            <h1
              className={clsx(
                "text-[28px] sm:text-[32px] font-bold text-ios-text tracking-tight leading-none",
                "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left",
                isScrolled
                  ? "opacity-100 translate-x-0 scale-100"
                  : "opacity-0 -translate-x-3 scale-95 pointer-events-none"
              )}
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

      {/* Main Page Body */}
      <div className="px-4 pt-2 pb-36 space-y-5">
        {/* Centered Greeting Section */}
        <div className="pt-1 pb-2 space-y-3 flex flex-col items-center text-center">
          {/* Spatial target placeholder where the large clock docks when unscrolled */}
          <div
            ref={heroTargetRef}
            className="w-[72px] h-[72px] flex items-center justify-center pointer-events-none"
          />
          <h2 className="text-[28px] sm:text-[32px] font-bold text-ios-text tracking-tight leading-[1.18] max-w-sm">
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
      </div>
    </div>
  );
};
