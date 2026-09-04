import React from 'react';
import clsx from 'clsx';
import type { TabType } from '../types';
import { SFSymbol } from './SFSymbol';

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
  const tabs: { id: TabType; label: string; icon: string }[] = [
    {
      id: 'home',
      label: 'Главная',
      icon: '/symbols/SVG_Vector/06_cleaning_sparkles.svg',
    },
    {
      id: 'schedule',
      label: 'График зарядок',
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
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom,16px),16px)] pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between gap-2 p-2 rounded-full backdrop-blur-2xl bg-[var(--ios-dock-bg)] border border-[var(--ios-dock-border)] shadow-ios-dock dark:shadow-ios-dock-dark transition-all duration-300">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className={clsx(
                'relative flex flex-col items-center justify-center min-w-[115px] py-3 px-4 rounded-full transition-all duration-250 ease-out font-medium',
                isActive
                  ? 'bg-ios-accent text-white shadow-glow-accent scale-[1.02]'
                  : 'text-ios-textSecondary hover:text-ios-text active:scale-95'
              )}
            >
              <SFSymbol
                src={tab.icon}
                className={clsx(
                  'w-6 h-6 transition-transform duration-200 mb-1',
                  isActive ? 'scale-110 text-white' : 'text-ios-textSecondary'
                )}
                alt={tab.label}
              />
              <span className="text-[12px] font-semibold tracking-tight leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
