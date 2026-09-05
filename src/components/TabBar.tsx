import React from 'react';
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

  const handleSelect = (tab: TabType) => {
    if (tab !== activeTab) {
      onHaptic?.();
      onTabChange(tab);
    }
  };

  const isSchedule = activeTab === 'schedule';

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
        <nav className="relative pointer-events-auto flex items-center p-2 rounded-full backdrop-blur-2xl bg-[var(--ios-dock-bg)] shadow-ios-dock dark:shadow-ios-dock-dark transition-all duration-300">
          {/* Animated tumbler sliding indicator pill */}
          <div
            className="absolute top-2 left-2 w-28 bottom-2 rounded-full bg-ios-accent shadow-glow-accent pointer-events-none z-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
            style={{
              transform: isSchedule ? 'translate3d(120px, 0, 0)' : 'translate3d(0, 0, 0)',
            }}
          />

          <div className="relative z-10 flex items-center gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelect(tab.id)}
                  className="flex flex-col items-center justify-center w-28 py-2.5 px-3 rounded-full transition-transform duration-200 ease-out font-medium active:scale-95"
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
          </div>
        </nav>
      </div>
    </>
  );
};
