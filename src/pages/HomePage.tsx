import React from 'react';
import { SFSymbol } from '../components/SFSymbol';

interface HomePageProps {
  userName?: string;
  onNavigateToSchedule: () => void;
  chargesCount: { charged: number; total: number };
}

export const HomePage: React.FC<HomePageProps> = ({
  userName = 'Коллега',
  onNavigateToSchedule,
  chargesCount,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto px-4 pt-4 pb-36 space-y-5 animate-fadeIn">
      {/* Top Welcome Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] font-bold text-ios-text tracking-tight">
          Вчасно
        </h1>

        <div className="w-11 h-11 rounded-full bg-ios-accent/15 border border-ios-accent/30 flex items-center justify-center text-ios-accent font-bold text-[16px] shadow-sm">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Hero Welcome Card with unclipped shadow */}
      <div className="rounded-ios bg-ios-card border border-ios-border shadow-ios-card dark:shadow-ios-card-dark relative">
        <div className="p-5 relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ios-green/15 text-ios-green text-[12px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-ios-green animate-pulse" />
            <span>Система активна</span>
          </div>
          <h2 className="text-[20px] font-bold text-ios-text tracking-tight">
            Привет, {userName}! 👋
          </h2>
          <p className="text-[14px] text-ios-textSecondary leading-relaxed">
            Здесь скоро появятся быстрые действия, статистика смен и отчёты.
            Сейчас доступен календарный график зарядок устройств.
          </p>
        </div>

        {/* Ambient background glow inside clipped overlay */}
        <div className="absolute inset-0 rounded-ios overflow-hidden pointer-events-none">
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-ios-accent/10 rounded-full blur-2xl" />
        </div>
      </div>

      {/* Quick Widget: Charges Today */}
      <div
        onClick={onNavigateToSchedule}
        className="p-5 rounded-ios bg-ios-card border border-ios-border shadow-ios-card dark:shadow-ios-card-dark cursor-pointer active:scale-[0.98] transition-all group"
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
              <h3 className="text-[17px] font-semibold text-ios-text group-hover:text-ios-accent transition-colors">
                Зарядки
              </h3>
              <p className="text-[13px] text-ios-textSecondary">
                {chargesCount.total > 0
                  ? `Сегодня заряжено ${chargesCount.charged} из ${chargesCount.total}`
                  : 'Проверить устройства'}
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

      {/* Future placeholders in clean iOS style */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-ios bg-ios-cardSubtle border border-ios-border opacity-70">
          <div className="w-10 h-10 rounded-xl bg-ios-item-bg flex items-center justify-center mb-2.5 text-ios-textSecondary">
            <SFSymbol
              src="/symbols/SVG_Vector/03_shifts_bell.svg"
              className="w-5 h-5"
            />
          </div>
          <span className="text-[13px] font-semibold text-ios-text block">
            Рабочие выходы
          </span>
          <span className="text-[11px] text-ios-textSecondary">В разработке</span>
        </div>

        <div className="p-4 rounded-ios bg-ios-cardSubtle border border-ios-border opacity-70">
          <div className="w-10 h-10 rounded-xl bg-ios-item-bg flex items-center justify-center mb-2.5 text-ios-textSecondary">
            <SFSymbol
              src="/symbols/SVG_Vector/05_cleaning_soap_bubbles.svg"
              className="w-5 h-5"
            />
          </div>
          <span className="text-[13px] font-semibold text-ios-text block">
            Ген. уборка
          </span>
          <span className="text-[11px] text-ios-textSecondary">В разработке</span>
        </div>
      </div>
    </div>
  );
};
