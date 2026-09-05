import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import clsx from 'clsx';
import type { TabType } from '../types';
import { SFSymbol } from './SFSymbol';
import { useI18n } from '../context/I18nContext';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onHaptic?: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabChange,
  onHaptic,
}) => {
  const { t } = useI18n();

  const tabs: { id: TabType; label: string; icon: string }[] = [
    {
      id: 'home',
      label: t.tabHome,
      icon: '/symbols/SVG_Vector/43_home_house.svg',
    },
    {
      id: 'schedule',
      label: t.tabSchedule,
      icon: '/symbols/SVG_Vector/01_charge_bolt.svg',
    },
  ];

  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    ready: boolean;
  }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  const tabRefs = useRef<Map<TabType, HTMLButtonElement>>(new Map());
  const hasMountedRef = useRef<boolean>(false);

  const updateIndicator = () => {
    const activeBtn = tabRefs.current.get(activeTab);
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        top: activeBtn.offsetTop,
        width: activeBtn.offsetWidth,
        height: activeBtn.offsetHeight,
        ready: true,
      });
    }
  };

  useLayoutEffect(() => {
    updateIndicator();
    const timeout = setTimeout(() => {
      hasMountedRef.current = true;
    }, 50);
    return () => clearTimeout(timeout);
  }, [activeTab, tabs]);

  useEffect(() => {
    const onResize = () => updateIndicator();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [activeTab]);

  const handleSelect = (tab: TabType) => {
    if (tab !== activeTab) {
      onHaptic?.();
      onTabChange(tab);
    }
  };

  return (
    <>
      {/* Bottom Dissolving Gradient: soft fade upward from var(--ios-bg) to transparent under the floating dock */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none transition-colors duration-200"
        style={{
          background:
            'linear-gradient(to top, var(--ios-bg) 0%, var(--ios-bg) 35%, transparent 100%)',
          height: 'max(calc(env(safe-area-inset-bottom, 0px) + 100px), 115px)',
        }}
      />

      {/* Floating Bottom TabBar Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-[max(calc(env(safe-area-inset-bottom,0px)+26px),30px)] pointer-events-none">
        <nav className="relative pointer-events-auto flex items-center justify-between gap-2 p-2 rounded-full backdrop-blur-2xl bg-[var(--ios-dock-bg)] shadow-ios-dock dark:shadow-ios-dock-dark transition-all duration-300">
          {/* Animated tumbler sliding indicator pill */}
          {indicatorStyle.ready && (
            <div
              className={clsx(
                'absolute top-0 left-0 rounded-full bg-ios-accent shadow-glow-accent pointer-events-none z-0',
                hasMountedRef.current
                  ? 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
                  : 'transition-none'
              )}
              style={{
                transform: `translate3d(${indicatorStyle.left}px, ${indicatorStyle.top}px, 0)`,
                width: `${indicatorStyle.width}px`,
                height: `${indicatorStyle.height}px`,
              }}
            />
          )}

          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.id, el);
                  else tabRefs.current.delete(tab.id);
                }}
                onClick={() => handleSelect(tab.id)}
                className={clsx(
                  'relative z-10 flex flex-col items-center justify-center min-w-[108px] py-2.5 px-5 rounded-full transition-transform duration-200 ease-out font-medium active:scale-95'
                )}
              >
                <SFSymbol
                  src={tab.icon}
                  className={clsx(
                    'w-6 h-6 transition-all duration-250 mb-1',
                    isActive ? 'scale-105 text-white' : 'scale-100 text-ios-textSecondary'
                  )}
                  alt={tab.label}
                />
                <span
                  className={clsx(
                    'text-[11.5px] font-semibold tracking-tight leading-tight transition-colors duration-250',
                    isActive ? 'text-white' : 'text-ios-textSecondary'
                  )}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};
