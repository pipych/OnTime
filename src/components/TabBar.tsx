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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-[max(calc(env(safe-area-inset-bottom,0px)+26px),30px)] pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between gap-2 p-2 rounded-full backdrop-blur-2xl bg-[var(--ios-dock-bg)] shadow-ios-dock dark:shadow-ios-dock-dark transition-all duration-300">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className={clsx(
                'relative flex flex-col items-center justify-center min-w-[108px] py-2.5 px-5 rounded-full transition-all duration-250 ease-out font-medium',
                isActive
                  ? 'bg-ios-accent text-white shadow-glow-accent scale-[1.02]'
                  : 'text-ios-textSecondary hover:text-ios-text active:scale-95'
              )}
            >
              <SFSymbol
                src={tab.icon}
                className={clsx(
                  'w-6 h-6 transition-transform duration-200 mb-1',
                  isActive ? 'scale-105 text-white' : 'text-ios-textSecondary'
                )}
                alt={tab.label}
              />
              <span className="text-[11.5px] font-semibold tracking-tight leading-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
