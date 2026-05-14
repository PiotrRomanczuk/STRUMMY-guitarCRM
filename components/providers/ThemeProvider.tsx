'use client';

import * as React from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => void;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: 'class';
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeClass(resolved: ResolvedTheme, disableTransition: boolean) {
  const root = document.documentElement;
  let restore: (() => void) | null = null;
  if (disableTransition) {
    const style = document.createElement('style');
    style.appendChild(document.createTextNode('*,*::before,*::after{transition:none!important}'));
    document.head.appendChild(style);
    restore = () => {
      window.getComputedStyle(document.body);
      setTimeout(() => document.head.removeChild(style), 1);
    };
  }
  if (resolved === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  restore?.();
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'theme',
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>('light');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeState(stored);
      }
    } catch {
      /* ignore */
    }
    setSystemTheme(getSystemTheme());
    setMounted(true);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [storageKey]);

  const resolvedTheme: ResolvedTheme =
    theme === 'system' && enableSystem ? systemTheme : theme === 'dark' ? 'dark' : 'light';

  React.useEffect(() => {
    if (!mounted) return;
    applyThemeClass(resolvedTheme, disableTransitionOnChange);
  }, [resolvedTheme, mounted, disableTransitionOnChange]);

  const setTheme = React.useCallback(
    (t: Theme) => {
      setThemeState(t);
      try {
        localStorage.setItem(storageKey, t);
      } catch {
        /* ignore */
      }
    },
    [storageKey]
  );

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (ctx) return ctx;
  return { theme: 'light', resolvedTheme: 'light', setTheme: () => {} };
}
