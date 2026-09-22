import { storage } from "@/utils/storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from 'react-native';
import { darkTheme } from './dark';
import { lightTheme } from './light';
import { Theme } from "./types";

type Mode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  mode: Mode;
  setMode: (m: Mode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = 'theme_preference';

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<Mode>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
   const savedMode = await storage.getItem(STORAGE_KEY)
    if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
      setModeState(savedMode);
    }
    setHydrated(true)
  })()
  }, [])

  const setMode = (m: Mode) => {
    setModeState(m);
    storage.setItem(STORAGE_KEY, m)
  }

  const resolvedMode =  mode === 'system' ? (systemScheme ?? 'light') : mode;
  const theme = resolvedMode === 'dark' ? darkTheme : lightTheme;

  const value = useMemo(() => ({theme, mode, setMode}), [theme, mode])

  if (!hydrated) return null

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}