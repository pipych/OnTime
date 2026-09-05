import { useEffect, useState, useCallback } from 'react';

// Telegram WebApp window declaration
declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

export function useTelegram() {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');
  const [isReady, setIsReady] = useState(false);

  // Initialize and request fullscreen
  useEffect(() => {
    if (!tg) {
      // Fallback for browser testing
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      setColorScheme(media.matches ? 'dark' : 'light');
      const listener = (e: MediaQueryListEvent) => {
        setColorScheme(e.matches ? 'dark' : 'light');
      };
      media.addEventListener('change', listener);
      setIsReady(true);
      return () => media.removeEventListener('change', listener);
    }

    try {
      tg.ready();
      tg.expand();

      // Telegram WebApp 7.7+ Fullscreen API
      if (typeof tg.requestFullscreen === 'function') {
        tg.requestFullscreen();
      }

      // Disable vertical swipe to prevent accidental exit
      if (typeof tg.disableVerticalSwipes === 'function') {
        tg.disableVerticalSwipes();
      }

      // Sync color scheme
      const currentScheme = tg.colorScheme === 'light' ? 'light' : 'dark';
      setColorScheme(currentScheme);

      // Set header color
      if (typeof tg.setHeaderColor === 'function') {
        tg.setHeaderColor(currentScheme === 'dark' ? '#0C0D11' : '#F2F2F7');
      }
      if (typeof tg.setBackgroundColor === 'function') {
        tg.setBackgroundColor(currentScheme === 'dark' ? '#0C0D11' : '#F2F2F7');
      }

      const onThemeChanged = () => {
        const newScheme = tg.colorScheme === 'light' ? 'light' : 'dark';
        setColorScheme(newScheme);
        if (typeof tg.setHeaderColor === 'function') {
          tg.setHeaderColor(newScheme === 'dark' ? '#0C0D11' : '#F2F2F7');
        }
        if (typeof tg.setBackgroundColor === 'function') {
          tg.setBackgroundColor(newScheme === 'dark' ? '#0C0D11' : '#F2F2F7');
        }
      };

      tg.onEvent?.('themeChanged', onThemeChanged);
      setIsReady(true);

      return () => {
        tg.offEvent?.('themeChanged', onThemeChanged);
      };
    } catch (e) {
      console.warn('Telegram WebApp init error:', e);
      setIsReady(true);
    }
  }, [tg]);

  // Synchronize document classes
  useEffect(() => {
    if (colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [colorScheme]);

  // Haptics
  const hapticImpact = useCallback(
    (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
      try {
        tg?.HapticFeedback?.impactOccurred(style);
      } catch (e) {}
    },
    [tg]
  );

  const hapticSuccess = useCallback(() => {
    try {
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (e) {}
  }, [tg]);

  const hapticSelection = useCallback(() => {
    try {
      tg?.HapticFeedback?.selectionChanged();
    } catch (e) {}
  }, [tg]);

  const user = tg?.initDataUnsafe?.user;

  return {
    tg,
    user,
    colorScheme,
    isReady,
    hapticImpact,
    hapticSuccess,
    hapticSelection,
  };
}
