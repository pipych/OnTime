import { useState, useMemo } from 'react';
import './App.css';
import { useTelegram } from './hooks/useTelegram';
import type { TabType } from './types';
import { TabBar } from './components/TabBar';
import { HomePage } from './pages/HomePage';
import { SchedulePage } from './pages/SchedulePage';
import { CHARGE_DAYS_MAP } from './constants/devices';
import { getLocalCharges } from './services/api';
import { getWeekId } from './utils/date';

export function App() {
  const { user, hapticImpact, hapticSuccess, hapticSelection } = useTelegram();
  const [activeTab, setActiveTab] = useState<TabType>('schedule');

  // Today charges summary for Home Page widget
  const todayChargesCount = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekId = getWeekId(today);
    const local = getLocalCharges(weekId);
    const todayItems = CHARGE_DAYS_MAP[dayOfWeek] || [];
    
    let charged = 0;
    for (const key of todayItems) {
      if (local[`CHG_${weekId}_${key}`]) {
        charged++;
      }
    }
    return { charged, total: todayItems.length };
  }, [activeTab]);

  const userName = user?.first_name || 'Коллега';

  return (
    <div className="min-h-screen bg-ios-bg text-ios-text flex flex-col justify-between transition-colors duration-200">
      {/* Safe Area Top Spacer for Telegram UI & Notch */}
      <div className="w-full pt-[max(calc(env(safe-area-inset-top,0px)+76px),88px)]" />

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col">
        {activeTab === 'home' && (
          <HomePage
            userName={userName}
            onNavigateToSchedule={() => {
              hapticImpact('medium');
              setActiveTab('schedule');
            }}
            chargesCount={todayChargesCount}
          />
        )}

        {activeTab === 'schedule' && (
          <SchedulePage
            onHapticImpact={hapticImpact}
            onHapticSuccess={hapticSuccess}
            onHapticSelection={hapticSelection}
          />
        )}
      </main>

      {/* Floating Bottom TabBar Dock */}
      <TabBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
        onHaptic={() => hapticSelection()}
      />
    </div>
  );
}

export default App;
