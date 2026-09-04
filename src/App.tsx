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
  const { lang, setLang } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [botUserName, setBotUserName] = useState<string>('');

  // Fetch bot user settings (language, custom name, etc.)
  useEffect(() => {
    if (user?.id) {
      const tgFullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;
      fetchUserDataFromGAS(
        user.id,
        tgFullName,
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

  const rawUserName =
    botUserName ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.username ||
    '';

  const userName = useMemo(() => {
    const firstName = (user?.first_name || '').toLowerCase();
    const lastName = (user?.last_name || '').toLowerCase();
    const username = (user?.username || '').toLowerCase();
    const rawLower = rawUserName.toLowerCase();

    // Specific localization for user Alina Zvereva:
    const isAlina =
      ((firstName.includes('алин') || firstName.includes('алін')) &&
        (lastName.includes('зверев') || lastName.includes('звєр') || lastName.includes('звєреаа') || username.includes('zverev'))) ||
      ((rawLower.includes('алин') || rawLower.includes('алін')) &&
        (rawLower.includes('зверев') || rawLower.includes('звєр') || rawLower.includes('звєреаа') || rawLower.includes('zverev')));

    if (isAlina) {
      return lang === 'uk' ? 'Аліна Звєрева' : 'Алина Зверева';
    }

    return rawUserName;
  }, [rawUserName, user?.first_name, user?.last_name, user?.username, lang]);

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

  // Determine initial language from cache or default to Ukrainian
  const initialLang: Language = useMemo(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vchasno_user_lang_v2') as Language | null;
      if (stored === 'ru' || stored === 'uk') return stored;
    }
    if (user?.language_code?.toLowerCase().startsWith('ru')) {
      return 'ru';
    }
    return 'uk';
  }, [user?.language_code]);

  return (
    <I18nProvider initialLang={initialLang}>
      <AppContent />
    </I18nProvider>
  );
}

export default App;
