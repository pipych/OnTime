import { useState, useMemo, useEffect } from 'react';
import './App.css';
import { useTelegram } from './hooks/useTelegram';
import type { TabType } from './types';
import { TabBar } from './components/TabBar';
import { HomePage } from './pages/HomePage';
import { SchedulePage } from './pages/SchedulePage';
import { CHARGE_DAYS_MAP } from './constants/devices';
import { getLocalCharges, fetchUserDataFromGAS } from './services/api';
import { getWeekId } from './utils/date';
import { I18nProvider, useI18n } from './context/I18nContext';
import type { Language } from './constants/i18n';

function AppContent() {
  const { user, hapticImpact, hapticSuccess, hapticSelection } = useTelegram();
  const { setLang } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [botUserName, setBotUserName] = useState<string>('');

  // Fetch bot user settings (language, custom name, etc.)
  useEffect(() => {
    if (user?.id) {
      fetchUserDataFromGAS(
        user.id,
        user.first_name || user.username,
        user.language_code
      ).then((data) => {
        if (data && data.ok) {
          if (data.lang) {
            setLang(data.lang);
          }
          if (data.user_name) {
            setBotUserName(data.user_name);
          }
        }
      });
    }
  }, [user?.id, setLang]);

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

  const userName = botUserName || user?.first_name || '';

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

export function App() {
  const { user } = useTelegram();

  // Determine initial language from Telegram language_code or cache
  const initialLang: Language = useMemo(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vchasno_user_lang') as Language | null;
      if (stored === 'ru' || stored === 'uk') return stored;
    }
    if (user?.language_code?.toLowerCase().startsWith('uk')) {
      return 'uk';
    }
    return 'ru';
  }, [user?.language_code]);

  return (
    <I18nProvider initialLang={initialLang}>
      <AppContent />
    </I18nProvider>
  );
}

export default App;
